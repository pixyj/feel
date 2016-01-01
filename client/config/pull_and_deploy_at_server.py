import os

DIST_DIR = "~/feel-client"

def exec_command(command):
    print("$ {}".format(command))
    os.system(command)


def fetch(db_user_id, commit):
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
    command = "cp dist-{}/nginx.conf /etc/nginx".format(commit)
    status = exec_command(command)
    if status != 0:
        raise Exception("Nginx file not copied to . Hint: Use sudo")


def reload_nginx():
    status = exec_command("nginx -s reload")
    if status != 0:
        raise Exception("Nginx file not reloaded. Check syntax")
        #todo -> rollback to previous nginx config


if __name__ == '__main__':
    fetch("47397190", "38b5ecaf817af25664232dfa9d0e29354cbcc73a")


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

