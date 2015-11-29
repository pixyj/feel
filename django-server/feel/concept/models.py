import uuid
import json
from collections import defaultdict

from django.db import models
from django.utils.text import slugify

from core.models import TimestampedModel, UUIDModel
from quiz.models import Quiz
from quiz.serializers import QuizSerializer




class Concept(TimestampedModel, UUIDModel):
    name = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    @property
    def slug(self):
        return slugify(self.name)

    
    def fetch_student_page(self):
        sections = self.conceptsection_set.all()
        section_quizzes = ConceptSection.get_quizzes_in_sections(sections)
        serialized_concept = ConceptSerializer(self)

        data = serialized_concept.data
        data['section_quizzes'] = section_quizzes
        return data


    def __str__(self):
        return "{} created by {} - Published? {}".format(self.name, self.created_by, self.is_published)



class ConceptSectionManager(models.Manager):

    def get_queryset(self):
        return super(ConceptSectionManager, self).get_queryset().order_by("position")



class ConceptSection(TimestampedModel, UUIDModel):

    PREREQ_QUIZ = 0
    MARKDOWN = 1
    QUIZ = 2
    VIDEO = 3
    VISUALIZATION = 4
    EXTERNAL_RESOURCES = 5
    EXIT_QUIZ = 6

    SECTION_TYPES = (
        (PREREQ_QUIZ, 0),
        (MARKDOWN, 1),
        (QUIZ, 2),
        (VIDEO, 3),
        (VISUALIZATION, 4),
        (EXTERNAL_RESOURCES, 5),
        (EXIT_QUIZ, 6)
    )

    concept = models.ForeignKey(Concept)
    position = models.IntegerField()
    type = models.IntegerField(choices=SECTION_TYPES)

    #Denormalized Field. I did not want to create a new table for each section-type
    #Also, makes the API design match the application state on the client closely.  
    data = models.TextField()

    objects = ConceptSectionManager()

    def get_additional_info(self):
        if self.type == ConceptSection.Quiz:
            return self._get_quiz_info()


    def _get_quiz_info(self):
        data = json.loads(self.data)
        quizzes = data['quizzes']
        return quizzes


    def __str__(self):
        return "{} - Section {} at position {}".format(self.concept, self.type, self.position)


    def is_quiz_section(self):
        section_type = self.type
        return section_type in [self.PREREQ_QUIZ, self.QUIZ, self.EXIT_QUIZ]

    @classmethod
    def get_quiz_sections(klass, sections):
        for section in sections:
            if section.is_quiz_section():
                yield section


    @classmethod
    def get_quizzes_in_sections(klass, sections):
        quiz_sections = klass.get_quiz_sections(sections)

        all_quiz_ids = []
        section_id_by_quiz_id = {}
        section_quizzes = defaultdict(list)
        #import ipdb;ipdb.set_trace()
        for section in quiz_sections:
            for quiz in section._get_quiz_info():
                quiz_id = quiz['id']
                all_quiz_ids.append(quiz_id)
                section_id_by_quiz_id[quiz_id] = section.id


        quizzes = Quiz.get_detailed_quizzes_in(all_quiz_ids)
        for quiz in quizzes:
            section_id = section_id_by_quiz_id[str(quiz.id)]
            serializer = QuizSerializer(quiz)
            section_quizzes[str(section_id)].append(serializer.data)

        return section_quizzes



    class Meta:
        unique_together = ('concept', 'position', )


#Avoid circular import
from concept.serializers import ConceptSerializer