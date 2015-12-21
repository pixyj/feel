import os
if __name__ == '__main__':
    status = os.system("sudo cp nginx.conf /usr/local/etc/nginx/nginx.conf")
    if status != 0:
        raise Exception("Nginx file not copied")

    os.system("sudo nginx -s reload")
    