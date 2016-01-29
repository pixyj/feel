from django.core.management.base import BaseCommand, CommandError
from course.models import CourseSlug

class CourseCommand(BaseCommand):

    def add_arguments(self, parser):
            parser.add_argument('courseslug', nargs='+', type=str)


    def handle(self, *args, **options):
        slug = options['courseslug'][0]
        try:
            courseslug = CourseSlug.objects.get(slug=slug)
            print("CourseSlug found")
            course = courseslug.course
            self.execute_course_method(course)
            print("Done")
        except CourseSlug.DoesNotExist:
            print("Error. CourseSlug does not exist")
            return

    # Override in base class
    def execute_course_method(self, course):
        assert(False)
