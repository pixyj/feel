from django.db.models.base import ModelBase

from quiz.models import Quiz, ShortAnswer, Choice, QuizAttempt
from codequiz.models import CodeQuiz, CodeQuizAttempt

from concept.models import Concept, ConceptSection
from course.models import Course, CourseSlug, CourseConcept, ConceptDependency


def reset():
    for key, item in globals().items():
        if type(item) == ModelBase and item != ModelBase:
            Model = item
            Model.objects.all().delete()

if __name__ == '__main__':
    reset()