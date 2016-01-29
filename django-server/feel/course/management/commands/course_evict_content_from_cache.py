from django.core.management.base import BaseCommand, CommandError
from course.models import CourseSlug

class Command(BaseCommand):
    help = "Clear all creator content from cache. Pass courseslug as argument"

    def add_arguments(self, parser):
            parser.add_argument('courseslug', nargs='+', type=str)


    def handle(self, *args, **options):
        slug = options['courseslug'][0]
        try:
            courseslug = CourseSlug.objects.get(slug=slug)
            print("CourseSlug found. Evicting content from cache")
            course = courseslug.course
            course.evict_content_from_cache()
            print("Done")
        except CourseSlug.DoesNotExist:
            print("Error. CourseSlug does not exist")
            return
