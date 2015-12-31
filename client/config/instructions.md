### 1. Ubuntu stuff

##### 1.1 If you get a Warning! Local Error, then add this line to /etc/environment; then reboot
`LC_ALL="en_US.UTF-8"`

##### 1.2 Set up Force yes for installing packages

**Check out instructions at http://superuser.com/a/164580/143733**
____

### 2. Add pramod user as root
    adduser pramod
____

### 3. Add pramod to sudoers group as root
    sudo adduser pramod pramod sudo

##### 3.1
*Login as pramod*
____

### 4. apt-get update
    sudo apt-get update
____

### 5. Install build-essential
    sudo apt-get install build-essential
____

### 8 Install git
    sudo apt-get install git
    sudo apt-get install git-core

____

### 9 Clone Repo

##### 9.1 Create code directory
    cd ~/
    mkdir code
    cd code
    mkdir feel
    cd ~/
    mkdir .feel-client
    cd .feel-client
    mkdir dist
    cd ~/

##### 9.2 Generate public key and add it to bitbucket. 
    ssh-keygen -t rsa
    cat ~/.ssh/id_rsa.pub

##### 9.3 Clone:
    cd ~/code/feel
    git clone git@bitbucket.org:pramodliv1/feel.git
____

### 6 Install python3.5 and related header files
    sudo add-apt-repository ppa:fkrull/deadsnakes
    sudo apt-get update
    sudo apt-get install python3.5
    sudo apt-get install python3.5-dev
    sudo apt-get install libpq-dev # for postgres driver
____

### 7 Install pip
    sudo apt-get install python-pip
____

### 10 Install virtualenvwrapper
    
##### 10.1
    sudo pip install virtualenvwrapper

##### 10.2
*Add `source /usr/local/bin/virtualenvwrapper.sh` to `.bashrc`*

##### 10.3
    source .bashrc
____

### 11 Create feel virtualenv

    mkvirtualenv feel --python=`which python3.5`

### 12 Install python deps

    workon feel
    cd ~/code/feel/feel/django-server
    pip install -r requirements.txt

### 13 Create keys.sh  (having all the API keys and passwords) and add to .bashrc

    echo "source ~/keys.sh" >> ~/.bashrc
    source ~/.bashrc

### 14 Install nginx
    
    sudo apt-get install nginx

### 15 Install postgresql-9.4
    
    #See http://askubuntu.com/a/638750/78690 for the madness

    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt-get update
    sudo apt-get upgrade
    sudo apt-get install postgresql-9.4

### 16 Configure postgresql-9.4 
    
##### 16.1 Truncate existing pg_hba.conf and postgresql.conf
    
    sudo truncate /etc/postgresql/9.4/main/pg_hba.conf --size=0
    sudo truncate /etc/postgresql/9.4/main/postgresql.conf --size=0

##### 16.2 Paste your new configuration files
    
    sudo vim /etc/postgresql/9.4/main/pg_hba.conf


    sudo vim /etc/postgresql/9.4/main/pg_hba.conf

##### 16.3 Restart Postgres
    
    sudo service postgresql restart

### 17 Create django postgres user

##### 17.1 Switch to postgres user

    sudo -u postgres psql

##### 17.2 Create user and db

    CREATE DATABASE django;
    CREATE USER django with PASSWORD 'django';
    GRANT ALL PRIVILEGES ON DATABASE "django" to django;
    ALTER USER "django" WITH PASSWORD '<password>';

### 18 Django <-> postgres 

##### 18.1 Ensure connection and setup tables
    cd ~/code/feel/feel/django-server/feel
    python manage.py check
    python manage migrate

##### 18.2 Create django superuser

    python manage.py createsuperuser

### 19 Configure And Reload Nginx
    
    cd "$REPO_LOCATION/config/nginx"
    sudo python deploy.py --conf="$NGINX_CONF_PATH" --repo="$REPO_LOCATION" --port="$NGINX_LISTEN_PORT"


