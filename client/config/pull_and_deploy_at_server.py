"""
This script must be run as root on the front-end server. 
Setup: 
1. Install nginx
2. Configure the DIST_DIR below, where the assets of each deployed commit will be located
   and will server as the root directory for nginx 

todo
1. Rollback nginx.conf to previous version in case of syntax error in nginx.conf
2. Send an email confirmation (optional)
3. Make it possible to deploy just nginx.conf
"""
import argparse
import os
import getpass


DIST_DIR = "~/feel-client"


def exec_command(command):
    print("$ {}".format(command))
    return os.system(command)


def fetch(db_user_id, commit):
    """Fetch zipped client assets and nginx.conf from Dropbox and place it at DIST_DIR"""
    file_name = "dist-{}.zip".format(commit)   
    url = "https://dl.dropboxusercontent.com/u/{}/feel-client/{}".format(db_user_id, file_name)
    command = "wget {}".format(url)
    try:    
        exec_command(command)
    except Exception as e:
        print("Unable to fetch {}".format(url))
        exit(1)
    dest_dir = os.path.expanduser(DIST_DIR)
    file_path = "{}/{}".format(dest_dir, file_name)
    unzip(file_path, dest_dir)
    

def unzip(file_path, dest):
    command = "unzip {} -d {}".format(file_path, dest)
    exec_command(command)


def place_config_file(commit):
    """
    Move nginx.conf from DIST_DIR to /etc/nginx directory"
    """
    command = "sudo mv dist-{}/nginx.conf /etc/nginx".format(commit)
    status = exec_command(command)
    if status != 0:
        message = """
        Nginx file not moved. 
        Hint: Check if nginx.conf exists in dist-{}.zip
        """
        raise Exception(message.format(commit))


def test_nginx_conf():
    status = exec_command("sudo nginx -t")
    if status != 0:
        raise Exception("Syntax error in nginx configuration")


def reload_nginx():
    status = exec_command("sudo nginx -s reload")
    if status != 0:
        raise Exception("Nginx file not reloaded. Check syntax")
        #todo -> rollback to previous nginx config


#Not used now
def send_email(user, pwd, recipient, subject, body):
    import smtplib

    gmail_user = user
    gmail_pwd = pwd
    FROM = user
    TO = recipient if type(recipient) is list else [recipient]
    SUBJECT = subject
    TEXT = body

    # Prepare actual message
    message = """\From: %s\nTo: %s\nSubject: %s\n\n%s
    """ % (FROM, ", ".join(TO), SUBJECT, TEXT)
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.login(gmail_user, gmail_pwd)
        server.sendmail(FROM, TO, message)
        server.close()
        print('successfully sent the mail')
    except:
        print("failed to send mail")


if __name__ == '__main__':
    unix_user = getpass.getuser()
    if unix_user != "root":
        print("Error: Must run this script as root")
        exit(1)
    parser = argparse.ArgumentParser(description='Deploy client code')
    parser.add_argument('-u','--user', help='Dropbox user_id', required=True)
    parser.add_argument('-c','--commit', help='Commit hash', required=True)
    args = vars(parser.parse_args())
    db_user_id = args['user']
    commit = args['commit']

    fetch(db_user_id, commit)
    place_config_file(commit)
    test_nginx_conf()
    reload_nginx()

