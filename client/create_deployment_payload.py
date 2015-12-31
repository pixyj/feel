import argparse
import os
from config.nginx.config_and_reload import create_temp_config_file

INPUT_ROOT_DIR = 'dist'
INPUT_CHILD_DIRS = ['font', 'min']


def exec_command(command):
    print("$ {}".format(command))
    os.system(command)


def create_payload(commit, output_zip_dir):
    parent_dir = "/tmp/dist-{}".format(commit)
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
    create_temp_config_file(os.environ, "{}/nginx.conf".format(parent_dir))

    zip_path = '{}/dist-{}.zip'.format(output_zip_dir, commit)
    command = 'zip -r {} {}'.format(zip_path, parent_dir)
    exec_command(command)
    command = 'rm -r {}'.format(parent_dir)
    exec_command(command)


def copy_to_dropbox(zip_path):
    command = "cp {} ~/Dropbox/Public/feel-client".format(zip_path)
    exec_command(command)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-c','--commit', help='Git commit', required=True)
    parser.add_argument('-z','--output_zip_dir', help='Where do you wanna store the zip?', required=True)
    args = vars(parser.parse_args())
    create_payload(args['commit'], args['output_zip_dir'])
        