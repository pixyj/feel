from django.contrib import admin

from .models import Course, CourseConcept, ConceptDependency


class CourseConceptInline(admin.StackedInline):
    model = CourseConcept
    extra = 0



class ConceptDependencyInline(admin.StackedInline):
    model = ConceptDependency
    extra = 0



class CourseAdmin(admin.ModelAdmin):
    inlines = [CourseConceptInline, ConceptDependencyInline]
    

admin.site.register(Course, CourseAdmin)