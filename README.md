# Feel - The code behind ConceptCoaster

## What?


Visit the Python tutorial on [ConceptCoaster](https://conceptcoaster.com/course/python-tutorial/) to check out an example course.
The application consists of two components: 

* **For Instructors**: A course and content creator you'd love to use. 
* **For Students**: A simple, responsive web app providing a zen-like learning experience.  

(This is a rewrite of my [previous project](https://github.com/pixyj/conceptgrapher)).

________

## Why? 

* Khan Academy and Coursera are not open source. You cannot run your own instance of these sites.
* Traditional Learning Management systems and EdX are clunky, focus too much on administrative aspects and suffer from feature creep. 

____

## Running your own playground instance of ConceptCoaster

### 1. [Install docker](https://docs.docker.com/engine/installation/)

### 2. Pull the image: 

```
docker pull pramodliv1/feel:0.3
```

### 3. Start the container: 

```
docker run -p 0.0.0.0:7777:7777 pramodliv1/feel:0.3 /root/start.sh
```

The container exposes a port on `7777`.

**Caution**
* Your data will be NOT be saved when the container is stopped. 
* The app does NOT connect to external dependencies like Algolia and HackerRank


## Internals

This is a single-page-app built using 

* React, Backbone and Materialize on the front-end
* Nginx as a reverse proxy
* Django as a JSON/HTTP server
* PostgreSQL as the primary datastore
* Redis for caching
* HackerRank to evaluate code
* Algolia for search
* Opbeat to measure django performance
* Cloudflare for HTTPS, CDN
* Azure and Digital Ocean VMs for hosting. 

_______
## Development

The application is in an exploratory stage, and may undergo drastic changes. The course-creator is not open to the public yet. I'm getting feedback from students and instructors. Issues are noted in a private spreadsheet and there no tests either. I'd love to hear your feedback. 
