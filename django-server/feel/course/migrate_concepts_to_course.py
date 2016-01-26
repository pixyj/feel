from .models import Course, CourseConcept
def migrate_concepts_to_course(course, concepts):
    for concept in concepts:
        attrs = {
            "created_at": concept.created_at,
            "created_by": concept.created_by,
            "last_modified_at": concept.last_modified_at,
            "last_modified_by" :concept.last_modified_by,
            "concept": concept,
            "course": course,
            "slug": concept.slug
        }
        CourseConcept.objects.create(**attrs)

