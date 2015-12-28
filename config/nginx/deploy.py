import os

from django.template import Template, Context
from django.template.engine import Engine

from django.conf import settings

settings.configure(DEBUG=True)


def get_conf_template_file_string():
    with open("./nginx.conf") as f:
        s = f.read()
    return s


def populate_template_string(s):
    template = Template(s, engine=Engine())
    context = Context(os.environ)
    return template.render(context)


def create_temp_config_file():
    template_string = get_conf_template_file_string()
    file_string = populate_template_string(template_string)
    with open("/tmp/nginx.conf", "w") as f:
        f.write(file_string)


def replace_config_file():
    command = "cp /tmp/nginx.conf {}".format(os.environ['NGINX_CONF_PATH'])
    status = os.system(command)
    if status != 0:
        raise Exception("Nginx file not copied to . Hing: Use sudo", os.environ['NGINX_CONF_PATH'])

def reload_nginx():
    status = os.system("nginx -s reload")
    if status != 0:
        raise Exception("Nginx file not reloaded. Check syntax")


if __name__ == '__main__':
    create_temp_config_file()
    print("Created temporary config file")
    replace_config_file()
    print("Placed config file at ", os.environ['NGINX_CONF_PATH'])
    reload_nginx()
    print("Reloaded Nginx, and we're done.")
    