from .base import *

DEBUG = False

ALLOWED_HOSTS = ['localhost', 'conceptcoaster.com', os.environ['PROD_VM_DOMAIN']]

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

##############################################################################

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

###############################################################################

STATIC_ROOT = "/home/pramod/feel-client/static-root"

###############################################################################

# DB Connections 
CONN_MAX_AGE = 60

###############################################################################

# OPBEAT 

INSTALLED_APPS += (
    'opbeat.contrib.django',
)

OPBEAT = {
    'ORGANIZATION_ID': os.environ['OPBEAT_ORGANIZATION_ID'],
    'APP_ID': os.environ['OPBEAT_APP_ID'],
    'SECRET_TOKEN': ['OPBEAT_SECRET_TOKEN'],
}

MIDDLEWARE_CLASSES = (
    'opbeat.contrib.django.middleware.OpbeatAPMMiddleware',
) + MIDDLEWARE_CLASSES
