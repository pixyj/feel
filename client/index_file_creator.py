import os

from django.template import Template, Context
from django.template.engine import Engine

from django.conf import settings

settings.configure(DEBUG=True)

def create_index_file_from_template(mode):
    if mode == "prod":
        options = {
            "DIST_DIR": "/dist/min",
            "VENDOR_CSS_PREFIX": "vendor.min",
            "APP_CSS_PREFIX": "app.min",
            "VENDOR_JS_PREFIX": "vendor-min",
            "APP_JS_PREFIX": "app-min",
        }
    elif mode == "dev":
        options = {
            "DIST_DIR": "/dist",
            "VENDOR_CSS_PREFIX": "vendor",
            "APP_CSS_PREFIX": "app",
            "VENDOR_JS_PREFIX": "vendor",
            "APP_JS_PREFIX": "app",
        }
    else:
        raise Exception("Invalid OPS_MODE, {} found".format(mode))

    with open("./index-template.html", "r") as f:
        template_string = f.read()

    template = Template(template_string, engine=Engine())
    context = Context(options)
    output_string = template.render(context)
    with open('index.html', 'w') as f:
        f.write(output_string)


if __name__ == "__main__":
    create_index_file_from_template(os.sys.argv[1])