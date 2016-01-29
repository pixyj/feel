from ._base_cache_command import CourseCommand
class Command(CourseCommand):

    help = "Clear all creator content from cache. Pass courseslug as argument"

    def execute_course_method(self, course):
        course.evict_content_from_cache()
            