import argparse
import os
import shutil


"""
Configure paths of min files 
"""
FILES = {
    'css': ['vendor', 'app'],
    'js': ['vendor', 'app']
};
DIR = 'dist/min'   


def add_commit_sufix(commit_hash):
    """
    Workhorse function. Dependency: Minified files must be present. 
    There's no error check yet to check their existence
    #todo -> As of now, vendor files and app files must be from same commit. Change this. 
    """
    global DIR
    parent_dir = DIR
    for extension, names in FILES.items():
        local_vars = locals()
        for name in names:
            local_vars['name'] = name
            old_path = "{parent_dir}/{name}-min.{extension}".format(**local_vars)
            new_path = "{parent_dir}/{name}-min-{commit_hash}.{extension}".format(**local_vars)
            try:
                print("{}   ---->   {}".format(old_path, new_path))
                shutil.copy2(old_path, new_path)
                print("Done")
            except Exception as e:
                import traceback
                traceback.print_exc()
                exit(1)
                



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Add commit suffix to minified files')
    parser.add_argument('-c','--commit', help='commit_hash', required=True)
    args = vars(parser.parse_args())
    commit_hash = args['commit']
    add_commit_sufix(commit_hash)




