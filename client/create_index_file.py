import os
import argparse

from django.template import Template, Context
from django.template.engine import Engine

from django.conf import settings
try:
    settings.configure(DEBUG=True)
except RuntimeError:
    pass


def create_index_file_from_template(mode, commit):
    if mode == "prod":
        options = {
            "DIST_DIR": "/dist/min",
            "VENDOR_CSS_PREFIX": "vendor.min",
            "APP_CSS_PREFIX": "app.min",
            "VENDOR_JS_PREFIX": "vendor-min",
            "APP_JS_PREFIX": "app-min",
            "INDEX_FILE_NAME": "prod-index.html",
            "COMMIT": "-{}".format(commit)
        }
    elif mode == "dev":
        options = {
            "DIST_DIR": "/dist",
            "VENDOR_CSS_PREFIX": "vendor",
            "APP_CSS_PREFIX": "app",
            "VENDOR_JS_PREFIX": "vendor",
            "APP_JS_PREFIX": "app",
            "INDEX_FILE_NAME": "index.html",
            "COMMIT": ""
        }
    else:
        raise Exception("Invalid OPS_MODE, {} found".format(mode))

    with open("./index-template.html", "r") as f:
        template_string = f.read()
    template = Template(template_string, engine=Engine())
    context = Context(options)
    output_string = template.render(context)

    with open(options['INDEX_FILE_NAME'], 'w') as f:
        f.write(output_string)



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create index file')
    parser.add_argument('-m','--mode', help='dev or prod', required=True)
    parser.add_argument('-c','--commit', help='Git commit', required=False)
    args = vars(parser.parse_args())
    
    mode = args['mode']
    commit = args['commit']
    if mode == 'prod' and commit is None:
        print("Error: --commit option is required in prod mode")
        exit(1)

    commit = commit or ""
    create_index_file_from_template(mode, commit)

