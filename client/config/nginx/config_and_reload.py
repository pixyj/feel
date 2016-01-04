import getpass
import argparse
import inspect
import os

from django.template import Template, Context
from django.template.engine import Engine

from django.conf import settings
settings.configure(DEBUG=True)


CONF = {
    "NGINX_CONF_PATH": None,
    "NGINX_LISTEN_PORT": None,
    "NGINX_ROOT": None,
    "REPO_LOCATION": None,
}

def local_function():
    pass

def module_path():
   ''' returns the module path without the use of __file__.  Requires a function defined 
   locally in the module.
   from http://stackoverflow.com/questions/729583/getting-file-path-of-imported-module'''
   return os.path.abspath(inspect.getsourcefile(local_function))

def module_dir_path():
    return '/'.join(module_path().split("/")[0:-1])

def get_conf_template_file_string():
    
    dir_path = module_dir_path()
    nginx_conf_path = "{}/{}".format(dir_path, 'nginx.conf')
    with open(nginx_conf_path, 'r') as f:
        s = f.read()
    return s


def populate_template_string(conf, s):
    template = Template(s, engine=Engine())
    context = Context(conf)
    return template.render(context)


def create_temp_config_file(conf, temp_path=None):
    temp_path = temp_path or "{}/temp.nginx.conf".format(module_dir_path())
    CONF['TEMP_PATH'] = temp_path
    template_string = get_conf_template_file_string()
    file_string = populate_template_string(conf, template_string)
    with open(temp_path, "w") as f:
        f.write(file_string)


def replace_config_file(conf):
    command = "cp temp.nginx.conf {}".format(conf['NGINX_CONF_PATH'])
    status = os.system(command)
    if status != 0:
        raise Exception("Nginx file not copied to . Hing: Use sudo", conf['NGINX_CONF_PATH'])

def reload_nginx():
    status = os.system("nginx -s reload")
    if status != 0:
        raise Exception("Nginx file not reloaded. Check syntax")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Configure and reload nginx')
    parser.add_argument('-c','--conf', help='Location of nginx.conf file', required=True)
    parser.add_argument('-p','--port', help='Nginx listening port', required=True)
    parser.add_argument('-r','--repo', help='Static files root', required=True)
    parser.add_argument('-t','--test', help='Create config without reload', required=False)

    args = vars(parser.parse_args())
    CONF['NGINX_CONF_PATH'] = args['conf']
    CONF['NGINX_LISTEN_PORT'] = args['port']
    CONF['REPO_LOCATION'] = args['repo']
    CONF['NGINX_ROOT'] = "{}/client".format(args['repo'])
    CONF['NGINX_DEV_MODE'] = True
    
    print("Parsed arguments", CONF)
    create_temp_config_file(CONF)
    print("Created temporary config file")
    if args['test']:
        print("In test mode, so we don't replace config file. Bye.")
        exit(0)
    else:
        if getpass.getuser() != 'root':
            print("\nERROR: Must run as root to configure nginx")
            exit(1)
    replace_config_file(CONF)
    print("Placed config file at ", os.environ['NGINX_CONF_PATH'])

    reload_nginx()
    print("Reloaded Nginx\n ** Done!  ** ")
    command = "rm {}".format(CONF['TEMP_PATH'])