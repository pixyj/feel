from allauth.account.signals import user_signed_up
from django.dispatch import receiver

from .models import QuizAttempt

@receiver(user_signed_up, dispatch_uid="quiz:quizattempt:user_signed_up")
def attribute_session_quizattempts_to_user(request, user, **kwargs):
    QuizAttempt.objects.attribute_to_user(user=user, user_key=request.session.session_key)

