import subprocess

from django.conf import settings
MY_APPS = settings.MY_APPS

COMMAND_FORMAT = "python manage.py dumpdata {app} > core/fixtures/{app}.json"

def update_fixtures():
    for app in MY_APPS:
        command = COMMAND_FORMAT.format(app=app)
        print(command)
        subprocess.check_output(command, shell=True)

if __name__ == '__main__':
    update_fixtures()