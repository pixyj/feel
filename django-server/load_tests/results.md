## January 20th, 2016: 

### Summary: 

So far, the bottleneck is the app-server tier. 

#### Setup:

* Run all the processes (Nginx, uWSGI, Postgres, Redis) on a tiny 512MB Digital Ocean droplet. 
* Use 3 uWSGI worker processes. (Change this did not help)

#### Results: 

uWSGI handles 35-40 requests per second with 300 concurrent users and maxes out the CPU at this level( memory usage at 90%). The median HTTP response time is around 1.5 seconds. At around 400 concurrent users, the site stops being usable. Nginx and Postgres seem fine. At around 100,000 quiz attempts in the DB, inserts take 7.8 ms per request. 

Serving static resources using Nginx is also fine. It is able to handle 4000 concurrent users before I run out of file descriptors. 

#### Changes Made: 

* Set `MAX_CONN_AGE` to 60 seconds (commit 43e832809d8753f0450f045c6cd7b51d4799f83b). 

* Installed DataDog agent just for fun. I'm mostly using htop as of now. Opbeat's UI is much better, though. 

#### Next Up: 

* Set up caching for content (i.e. not student personal details) at Nginx. 

* Use a bigger server, repeat the tests and see how much you can handle by throwing more RAM. 

* Set up retries on the client for idempotent requests. The client must be able to handle the server becoming unavailable for a few seconds (as it did during the load tests).

* Monitor all tiers, not just django. 

#### Not doing as of now. Maybe in the future: 

* I read that using a cache backend for sessions is a good optimization. But Opbeat says it's taking only 4.4 ms on average. (I don't know how to get a histogram for individual SQL calls yet). So I'm leaving it alone.

* Using multiple boxes. For the initial launch, I'm not doing anything fancy, as of now. 

* Containers: Docker linking is a pain to setup and the ecosystem is moving fast. I don't want to use Docker for Nginx, Postgres and other processes which don't change much. But for app servers, sure. 
 
#### Random thoughts: 

* Damn, Python is slow. I'm tempted to learn Elixir! But it will be a few months (years?) before I become as productive as I'm with Python.

* Should I switch to MySQL because it has better tooling and more hosting options? The only PostgreSQL-specific thing I'm using is `JSONField` from `django.contrib.postgres`. 



____________________________________


## February 10th, 2016: 


#### Setup:

* Run all the processes (Nginx, uWSGI, Postgres, Redis, codechecker proxy to HackerRank API) on a 4 core, 14 GB RAM Azure VM. 
* Use 6 uWSGI worker processes. (Changing this did not make palpable difference)
* Use 2 Nginx worker processes.  
* Testing was performed directly on the VM without using Cloudflare proxy. 

#### Changes incorporated from previous test: 

* Cached requests common to all students. Only student-specific requests like Progress, QuizAttempts hit the database. 
* The site now runs on a bigger machine.
* Added retries for GET requests on the client. 

### Summary: 

The bottleneck continues to be the CPU usage due to the uWsgi processes. Nginx, Postgres and Redis did not occupy more than 2% of the CPU. Only 700 MB of RAM was used before the CPU maxed out. 

#### Results: 

uWSGI handles 35-40 requests per second with 500 concurrent users and maxes out the CPU at this level( memory usage at 700 MB of RAM). With 500 concurrent users making requests as per the tasks at `locustfile.py`, the median HTTP response time is around 10ms for cached content! Whoa! But /api/v1/user, /student-progress and quiz attempts (both GET and POST) remains slow. with response times varying between 1s to 5s.  Unfortunately, Opbeat was not working yesterday. I reached their support. But I fell asleep soon. I'll probably test again to find the bottleneck functions and queries. 

#### Next Up: 

* Find the bottlenecks in the uwsgi/django tier. See if any other configurations in uWSGI help. 
* Check with the community if they're seeing better performance levels.   
* I wasted 12 GB of RAM. So run the site with a higher CPU to RAM ratio. 

