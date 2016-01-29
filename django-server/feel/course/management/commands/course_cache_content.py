from django.core.management.base import BaseCommand, CommandError
from course.models import CourseSlug

class Command(BaseCommand):
    help = "Cache all creator content. Pass courseslug as argument"

    def add_arguments(self, parser):
            parser.add_argument('courseslug', nargs='+', type=str)


    def handle(self, *args, **options):
        slug = options['courseslug'][0]
        try:
            courseslug = CourseSlug.objects.get(slug=slug)
            print("CourseSlug found. Caching content")
            course = courseslug.course
            course.cache_content()
            print("Done")
        except CourseSlug.DoesNotExist:
            print("Error. CourseSlug does not exist")
            return
