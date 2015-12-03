import uuid

from django.db import models, transaction
from django.utils.text import slugify
from django.core.exceptions import PermissionDenied

from core.models import TimestampedModel, UUIDModel, SlugModel
from concept.models import Concept



class Course(TimestampedModel, UUIDModel):
    name = models.CharField(max_length=256)
    is_published = models.BooleanField(default=False)

    def publish_and_slugify(self):
        self.is_published = True
        with transaction.atomic():
            slug = slugify(self.name)
            previous = CourseSlug.objects.filter(slug__contains=slug).last()
            if previous is not None:
                try:
                    number = int(previous.slug.split("-")[-1]) + 1
                except ValueError:
                    number = 1
                slug = "{}-{}".format(slug, number)

            courseslug = CourseSlug.objects.create(course=self, slug=slug)
            CourseSlug.objects.filter(course=self).exclude(slug=slug).delete()
            self.save()
            
        return courseslug


    def unpublish(self):
        self.is_published = False
        with transaction.atomic():
            self.courseslug_set.all().delete()
            self.save()


    @property
    def concepts(self):
        return CourseConcept.courseconcepts.items(self)


    @property
    def dependencies(self):
        dependencies = [dep for dep in self.conceptdependency_set.only('start', 'end').all()]
        return dependencies


    @property
    def url(self):
        return "/course/{}/"(slugify(self.name))


    def get_concept_by_name(self, name):
        slug = slugify(name)
        concepts = self.get_concepts()
        filtered_concepts = list(filter(lambda c : c.slug == slug, concepts))
        if not filtered_concepts:
            raise Concept.DoesNotExist
        return filtered_concepts[0]


    def add_concept(self, name):
        concept = Concept.objects.create(created_by=self.created_by,\
                            last_modified_by=self.created_by, name=name)
        courseconcept = CourseConcept.objects.create(course=self,concept=concept)
        return concept


    def __str__(self):
        return "{} created by {} - Published? {}".format(self.name, self.created_by, self.is_published)


class CourseSlug(SlugModel):
    course = models.ForeignKey(Course)

    def __str__(self):
        return "{} - {}".format(self.course, self.slug)



class CourseConceptManager(models.Manager):

    def items(self, course):
        return course.courseconcept_set.select_related('concept').only('concept').all()


class CourseConcept(TimestampedModel, UUIDModel):
    course = models.ForeignKey(Course)
    concept = models.ForeignKey(Concept)

    courseconcepts = CourseConceptManager()


    @property
    def url(self):
        return "{}{}/".format(self.course.url, slugify(self.concept.name))


    def __str__(self):
        return "{} belonging to {}".format(self.concept, self.course)


    class Meta:
        unique_together = ("course", "concept", )



class ConceptDependency(TimestampedModel, UUIDModel):
    course = models.ForeignKey(Course)
    start = models.ForeignKey(CourseConcept, related_name="start_set")
    end = models.ForeignKey(CourseConcept, related_name="end_set")

    def __str__(self):
        return "{} -> {} in {}".format(self.start, self.end, self. course)


    class Meta:
        unique_together = ('course', 'start', 'end', )
