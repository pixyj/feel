from concept.models import ConceptSection

def run():
    models = ConceptSection.objects.all()
    for instance in models:
        data = instance.data
        if 'quizzes' in data:
            quiz_ids = [quiz['id'] for quiz in data['quizzes']]
            print(instance.id, quiz_ids)
            data['quiz_ids'] = quiz_ids
            del data['quizzes']
            instance.data = data
            instance.save()
            print("                 ****                ")