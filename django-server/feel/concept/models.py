import itertools
from collections import defaultdict

from django.contrib.postgres.fields import JSONField
from django.core.cache import cache
from django.db import models
from django.utils.text import slugify

from core.models import TimestampedModel, UUIDModel
from quiz.models import Quiz, QuizAttempt
from quiz.serializers import QuizSerializer
from codequiz.models import CodeQuiz, CodeQuizAttempt


class Concept(TimestampedModel, UUIDModel):
    name = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    @property
    def slug(self):
        return slugify(self.name)

    @property
    def course_pretest_quiz(self):
        section_type = ConceptSection.COURSE_PRETEST
        section = self.conceptsection_set.filter(type=section_type).last()
        if not section:
            return None

        quiz_ids = section.get_quiz_info()
        if not quiz_ids:
            return None

        quiz_id = quiz_ids[0]
        quiz = Quiz.get_detailed_quizzes_in([quiz_id]).first()
        if not quiz:
            # todo -> log error here
            return None
        serializer = QuizSerializer(quiz)
        return serializer.data

    @property
    def _page_cache_key(self):
        return "concept:{}:page".format(self.id)

    @property
    def page(self):
        key = self._page_cache_key
        data = cache.get(key)
        if data is not None:
            return data
        serializer = ConceptSerializer(self)
        data = serializer.data
        return data

    def cache_page(self):
        """
        Cache concept and its sections, which are common to all students.
        As of now, the page is cached only when the course is published and
        evicted when the course is unpublished.
        Standalone concept pages are not cached as of now.
        """
        key = self._page_cache_key
        data = self.page
        cache.set(key, data, timeout=None)
        return data

    def evict_cached_page(self):
        key = self._page_cache_key
        return cache.delete(key)
    
    # Quizzes

    @property
    def _quiz_ids_cache_key(self):
        return "concept:{}:quiz_ids".format(self.id)

    def get_quiz_ids(self):
        key = self._quiz_ids_cache_key
        data = cache.get(key)
        if data is not None:
            return data
        sections = self.conceptsection_set.all()
        section_quizzes = ConceptSection.get_quizzes_in_sections(sections)
        quiz_ids = []
        for section, quizzes in section_quizzes.items():
            quiz_ids.extend([quiz['id'] for quiz in quizzes])
        return quiz_ids

    def cache_quiz_ids(self):
        data = self.get_quiz_ids()
        key = self._quiz_ids_cache_key
        cache.set(key, data, timeout=None)
        return data

    def evict_cached_quiz_ids(self):
        key = self._quiz_ids_cache_key
        return cache.delete(key)

    def get_user_quizattempts(self, user_key):
        quiz_ids = self.get_quiz_ids()
        return QuizAttempt.objects.get_user_attempts_in_quizzes(user_key, quiz_ids)

    # Code Quizzes

    @property
    def _codequiz_ids_cache_key(self):
        return "concept:{}:codequiz_ids".format(self.id)

    def get_codequiz_ids(self):
        key = self._codequiz_ids_cache_key
        data = cache.get(key)
        if data is not None:
            return data
        sections = self.conceptsection_set.all()
        return ConceptSection.get_codequiz_ids(sections)

    def cache_codequiz_ids(self):
        data = self.get_codequiz_ids()
        key = self._codequiz_ids_cache_key
        cache.set(key, data, timeout=None)
        return data

    def evict_cached_codequiz_ids(self):
        key = self._codequiz_ids_cache_key
        return cache.delete(key) 

    def get_user_codequizattempts(self, user_key):
        quiz_ids = self.get_codequiz_ids()
        return CodeQuizAttempt.get_user_attempts_in_quizzes(user_key, quiz_ids)

    # Top Level Cache APIs

    def cache_content(self):
        self.cache_page()
        self.cache_quiz_ids()
        self.cache_codequiz_ids()

    def evict_content_from_cache(self):
        self.evict_cached_page()
        self.evict_cached_quiz_ids()
        self.evict_cached_codequiz_ids()

    # Student APIs
    def fetch_student_page(self):
        sections = self.conceptsection_set.all()
        section_quizzes = ConceptSection.get_quizzes_in_sections(sections)
        serialized_concept = ConceptSerializer(self)

        data = serialized_concept.data
        data['section_quizzes'] = section_quizzes
        return data

    # Should we remove the codequiz table and create a generic 
    # json table for all kinds of quizzes? 
    def get_student_progress(self, user_key):
        quiz = self.get_student_quiz_progress(user_key)
        codequiz = self.get_student_codequiz_progress(user_key)
        return {
            "quiz": quiz,
            "codequiz": codequiz
        }

    def get_student_quiz_progress(self, user_key):
        quiz_ids = self.get_quiz_ids()
        count = QuizAttempt.objects.get_answered_quiz_count_in(user_key, quiz_ids)
        return {
            "answered": count,
            "total": len(quiz_ids)
        }

    def get_student_codequiz_progress(self, user_key):
        ids = self.get_codequiz_ids()
        # todo -> Use a manager instead. 
        count = CodeQuizAttempt.get_answered_codequiz_count_in(user_key, ids)
        return {
            "answered": count,
            "total": len(ids)
        }

    # Creator APIs
    @classmethod
    def get_concepts_created_by_user(self, user):
        fields = ('name', 'id', 'created_at', 'last_modified_at', )
        concepts = Concept.objects.filter(created_by=user)\
                                  .only(*fields)\
                                  .order_by('-created_at')
        return ConceptHeadingSerializer(concepts, many=True)

    # SEARCH INDEX APIs
    @property
    def name_index_data(self):
        serialized_data = ConceptHeadingSerializer(self).data
        return dict(serialized_data)

    @property
    def text_content_index_data(self):
        sections = self.conceptsection_set.filter(type=ConceptSection.MARKDOWN)
        attrs = self.name_index_data
        attrs['text'] = '\n'.join((section.data['input'] for section in sections))
        return attrs

    @property
    def quiz_index_data(self):
        quiz_section_types = [ConceptSection.QUIZ, ConceptSection.EXIT_QUIZ,
                         ConceptSection.PREREQ_QUIZ]
        code_quiz_section_type = [ConceptSection.CODE_QUIZ]

        def get_quiz_inputs(self, Model, section_types):
            sections = self.conceptsection_set.filter(type__in=section_types)
            section_quiz_ids = [section.data['quiz_ids'] for section in sections]
            quiz_ids = itertools.chain(*section_quiz_ids)
            queryset = Model.objects.filter(pk__in=quiz_ids)
            return [(model.pk, model.question_input, ) for model in queryset]

        quiz_inputs = get_quiz_inputs(self, Quiz, quiz_section_types)
        codequiz_inputs = get_quiz_inputs(self, CodeQuiz, code_quiz_section_type)
        all_quiz_inputs = quiz_inputs + codequiz_inputs
        objects = []
        for pk, question_input in all_quiz_inputs:
            obj = self.name_index_data
            obj['quiz_id'] = pk
            obj['question_input'] = question_input
            objects.append(obj)
        return objects

    def __str__(self):
        s = "{} created by {} - Published? {}"
        return s.format(self.name, self.created_by, self.is_published)


class ConceptSectionManager(models.Manager):

    def get_queryset(self):
        return super(ConceptSectionManager, self).get_queryset().order_by("position")


class ConceptSection(TimestampedModel, UUIDModel):

    COURSE_PRETEST = 0
    PREREQ_QUIZ = 1
    QUIZ = 2
    CODE_QUIZ = 3
    EXIT_QUIZ = 4
    MARKDOWN = 5
    VIDEO = 6
    VISUALIZATION = 7

    SECTION_TYPES = (
        (COURSE_PRETEST, 0),
        (PREREQ_QUIZ, 1),
        (QUIZ, 2),
        (CODE_QUIZ, 3),
        (EXIT_QUIZ, 4),
        (MARKDOWN, 5),
        (VIDEO, 6),
        (VISUALIZATION, 7)
    )

    concept = models.ForeignKey(Concept)
    position = models.IntegerField()
    type = models.IntegerField(choices=SECTION_TYPES)

    # Denormalized Field. I did not want to create a new table for
    # each section-type. Also, makes the API design match the
    # application state on the client closely.
    data = JSONField()

    objects = ConceptSectionManager()

    def get_additional_info(self):
        if self.type == ConceptSection.Quiz:
            return self.get_quiz_info()

    def get_quiz_info(self):
        data = self.data
        return data['quiz_ids']

    def __str__(self):
        s = "{} - Section {} at position {}"
        return s.format(self.concept, self.type, self.position)

    def is_quiz_section(self):
        section_type = self.type
        quiz_types = [self.QUIZ, self.EXIT_QUIZ]
        return section_type in quiz_types

    def has_quizzes(self):
        return self.type in [self.QUIZ, self.EXIT_QUIZ, 
                             self.COURSE_PRETEST, 
                             self.PREREQ_QUIZ, self.EXIT_QUIZ]

    def has_codequizzes(self):
        return self.type in [self.CODE_QUIZ]

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
        for section in quiz_sections:
            for quiz_id in section.get_quiz_info():
                all_quiz_ids.append(quiz_id)
                section_id_by_quiz_id[quiz_id] = section.id

        quizzes = Quiz.get_detailed_quizzes_in(all_quiz_ids)
        for quiz in quizzes:
            section_id = section_id_by_quiz_id[str(quiz.id)]
            serializer = QuizSerializer(quiz)
            section_quizzes[str(section_id)].append(serializer.data)

        return section_quizzes

    @classmethod
    def get_codequiz_ids(klass, sections):
        quiz_sections = sections.filter(type=klass.CODE_QUIZ).only('data')
        all_quiz_ids = []
        for section in quiz_sections:
            data = section.data
            quiz_ids = data['quiz_ids']
            all_quiz_ids.extend(quiz_ids)
        return all_quiz_ids

    class Meta:
        unique_together = ('concept', 'position', )


# Avoid circular import
from concept.serializers import ConceptSerializer, ConceptHeadingSerializer
