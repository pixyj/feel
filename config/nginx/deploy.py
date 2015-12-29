import os
import argparse

from django.template import Template, Context
from django.template.engine import Engine

from django.conf import settings

settings.configure(DEBUG=True)

CONF = {
    "NGINX_CONF_PATH": None,
    "NGINX_LISTEN_PORT": None,
    "REPO_LOCATION": None
}

def get_conf_template_file_string():
    with open("./nginx.conf") as f:
        s = f.read()
    return s


def populate_template_string(s):
    template = Template(s, engine=Engine())
    context = Context(CONF)
    return template.render(context)


def create_temp_config_file():
    template_string = get_conf_template_file_string()
    file_string = populate_template_string(template_string)
    with open("./temp.nginx.conf", "w") as f:
        f.write(file_string)


def replace_config_file():
    command = "cp ./temp.nginx.conf {}".format(CONF['NGINX_CONF_PATH'])
    status = os.system(command)
    if status != 0:
        raise Exception("Nginx file not copied to . Hing: Use sudo", CONF['NGINX_CONF_PATH'])

def reload_nginx():
    status = os.system("nginx -s reload")
    if status != 0:
        raise Exception("Nginx file not reloaded. Check syntax")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Configure and reload nginx')
    parser.add_argument('-c','--conf', help='Location of nginx.conf file', required=True)
    parser.add_argument('-p','--port', help='Location of feel repo', required=True)
    parser.add_argument('-r','--repo', help='Location of feel repo', required=True)

    args = vars(parser.parse_args())
    CONF['NGINX_CONF_PATH'] = args['conf']
    CONF['NGINX_LISTEN_PORT'] = args['port']
    CONF['REPO_LOCATION'] = args['repo']
    
    print("Parsed arguments", CONF)
    create_temp_config_file()
    print("Created temporary config file")
    replace_config_file()
    print("Placed config file at ", os.environ['NGINX_CONF_PATH'])
    reload_nginx()
    print("Reloaded Nginx\n😀   Done!  😀")
    