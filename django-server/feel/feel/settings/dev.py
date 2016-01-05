from .base import *

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# DON'T WORRY: The secret key used in production is secret.
SECRET_KEY = 'n=-39o#7*qmrx@*!r&^wx77ys=ukkfjt8%v2qifwfk^6(4n2l4'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'django',
        'USER': 'django',
        'PASSWORD': 'django',
        'HOST': 'localhost',
        'PORT': '5432'
    }
}

################################ DEBUG TOOLBAR #####################################



DJANGO_DEBUB_TOOLBAR_TESTING = False

if DJANGO_DEBUB_TOOLBAR_TESTING:
    INSTALLED_APPS += ('debug_toolbar', )
    MIDDLEWARE_CLASSES = ('debug_toolbar.middleware.DebugToolbarMiddleware', )\
                    + MIDDLEWARE_CLASSES + ('core.middleware.JsonAsHtml', )

