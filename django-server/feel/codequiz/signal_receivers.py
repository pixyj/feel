from allauth.account.signals import user_signed_up
from django.dispatch import receiver

from .models import CodeQuizAttempt

#todo -> this is copy pasted from quiz/signal_receivers. Can we extract common code? 

@receiver(user_signed_up, dispatch_uid="codequiz:codequizattempt:user_signed_up")
def attribute_session_quizattempts_to_user(request, user, **kwargs):
    CodeQuizAttempt.objects.attribute_to_user(user=user, user_key=request.session.session_key)

