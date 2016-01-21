from locust import HttpLocust, TaskSet, task

import json

def log(message):
    with open("locust.log", "a") as f:
        f.write(message + "\n")

class UserBehavior(TaskSet):
    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self.login()

    def login(self):
        pass

    @task(1)
    def profile(self):
        response = self.client.get("/dist/retina_dust.png")
        

class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait=5000
    max_wait=9000

