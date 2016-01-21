## January 20th, 2016: 

### Summary: 

So far, the bottleneck is theapp Server tier. 

#### Setup:

Run all the processes (Nginx, uWSGI, Postgres, Redis) on a tiny 512MB Digital Ocean droplet. 

#### Results: 

The bottleneck so far is the app server tier. 

The server handles 35-40 requests per second with 300 concurrent users and maxes out the CPU at this level( memory usage at 90%). The median HTTP response time is around 1.5 seconds. At around 400 concurrent users, the site stops being usable. Nginx and Postgres seem fine. At around 100,000 quiz attempts in the DB, inserts take 7.8 ms per request. 

Serving static resources using Nginx is also fine. It is able to handle 4000 concurrent users before I run out of file descriptors. 

#### Changes Made: 

* Set `MAX_CONN_AGE` to 60 seconds (commit 43e832809d8753f0450f045c6cd7b51d4799f83b). 

* Installed DataDog agent just for fun. I'm mostly using htop as of now. Opbeat's UI is much better, though. 

#### Next Up: 

* Set up caching for content (i.e. not student personal details) at Nginx. 

* Use a bigger server, repeat the tests and see how much you can handle by throwing more RAM. 

* Set up retries on the client for idempotent requests. The client must be able to handle the server becoming unavailable for a few seconds(as it did during the load tests)

* Monitor all tiers, not just django. 

#### Not doing as of now. Maybe in the future: 

* I read that using a cache backend for sessions is a good optimization. But Opbeat says it's taking only 4.4 ms on average. (I don't know how to get a histogram for individual SQL calls yet). So I'm leaving it alone.

* Using multiple boxes. For the initial launch, I'm not doing anything fancy, as of now. 

* Containers: Docker linking is a pain to setup and the ecosystem is moving fast. I don't want to use Docker for Nginx, Postgres and other processes which don't change much. But for app servers, sure. 
 
#### Random thoughts: 

* Damn, Python is slow. I'm tempted to learn Elixir! But it will be a few months before I become as productive.

* Should I switch to MySQL because it has better tooling and more hosting options? The only PostgreSQL-specific thing I'm using is `JSONField` from `django.contrib.postgres`. 
