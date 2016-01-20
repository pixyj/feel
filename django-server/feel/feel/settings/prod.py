from .base import *

DEBUG = False

ALLOWED_HOSTS = ['localhost', 'conceptcoaster.com']

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'django',
        'USER': os.environ['POSTGRES_USER'],
        'PASSWORD': os.environ['POSTGRES_PASSWORD'],
        'HOST': 'localhost',
        'PORT': os.environ['POSTGRES_PORT']
    }
}

CONN_MAX_AGE = 60


STATIC_ROOT = "/home/pramod/feel-client/static-root"
