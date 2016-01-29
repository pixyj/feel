from ._base_cache_command import CourseCommand
class Command(CourseCommand):

    help = "Cache all creator content. Pass courseslug as argument"

    def execute_course_method(self, course):
        course.cache_content()
