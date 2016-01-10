from django.contrib import admin

from .models import CodeQuiz, CodeQuizAttempt

admin.site.register(CodeQuiz)
admin.site.register(CodeQuizAttempt)