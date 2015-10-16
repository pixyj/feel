from django.contrib import admin

#Just using for testing. We won't be using admin for data entry in this project, hopefully!

from .models import Quiz, ShortAnswer, Choice

admin.site.register(Quiz)
admin.site.register(ShortAnswer)
admin.site.register(Choice)