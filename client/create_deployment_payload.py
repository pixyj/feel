import argparse
import os
from config.nginx.config_and_reload import create_temp_config_file
from create_index_file import create_index_file_from_template


INPUT_ROOT_DIR = 'dist'
INPUT_CHILD_DIRS = ['font', 'min', 'images']


def exec_command(command):
    print("$ {}".format(command))
    os.system(command)


def create_payload(commit, output_zip_dir):
    parent_dir = "dist-{}".format(commit)
    try:
        os.mkdir(parent_dir)
    except FileExistsError:
        print("WARN: Temporary dist directory exists already. Recreating it")
        exec_command('rm -r {}'.format(parent_dir))
        os.mkdir(parent_dir)

    for child_dir in INPUT_CHILD_DIRS:
        input_dir = '{}/{}'.format(INPUT_ROOT_DIR, child_dir)
        output_dir = '{}/{}'.format(parent_dir, child_dir)
        command = 'cp -r {} {}'.format(input_dir, output_dir)
        exec_command(command)

    print("Creating nginx.conf and placing it in {}".format(parent_dir))
    #todo Make this configurable. And remove your name, dude. 
    conf = {
        'NGINX_ROOT': "/home/pramod/feel-client",
        'NGINX_LISTEN_PORT': '80',
        'NGINX_INDEX_HTML_DIR': '/dist-{}'.format(commit),
        'NGINX_DEV_MODE': False,
        'COMMIT': commit
    }
    create_temp_config_file(conf, "{}/nginx.conf".format(parent_dir))
    print("Creating prod-index.html and placing it as index.html")
    create_index_file_from_template('prod', commit)
    command = "cp {} {}/index.html".format('prod-index.html', parent_dir)
    exec_command(command)
    command = "cp {} {}".format('dist/retina_dust.png', parent_dir)
    exec_command(command)
    dir_name = 'dist-{}'.format(commit)
    command = 'zip -r {}/dist-{}.zip {}'.format(output_zip_dir, commit, dir_name)
    exec_command(command)
    #command = 'rm -r {}'.format(parent_dir)
    #exec_command(command)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-c','--commit', help='Git commit', required=True)
    parser.add_argument('-z','--output_zip_dir', help='Where do you wanna store the zip?', required=True)
    args = vars(parser.parse_args())
    create_payload(args['commit'], args['output_zip_dir'])
        