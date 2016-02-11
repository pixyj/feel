import json

from locust import HttpLocust, TaskSet, task

def log(message):
    with open("locust.log", "a") as f:
        f.write(message + "\n")

class UserBehavior(TaskSet):
    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self.login()

    def login(self):
        response = self.client.get("/api/v1/user/")
        self.csrftoken = response.cookies['csrftoken']
        self.cookie = response.headers['Set-Cookie']

    @property
    def headers(self):
        headers = {
            "X-CSRFToken": self.csrftoken,
            "Cookie": self.cookie,
            "Content-Type": "application/json"
        }
        return headers

    @task(1)
    def course_model(self):
        response = self.client.get("/api/v1/courses/python-tutorial/")

    @task(2)
    def concepts(self):
        self.client.get("/api/v1/courses/python-tutorial/concepts/")
    
    @task(3)
    def deps(self):
        self.client.get("/api/v1/courses/python-tutorial/dependencies/", headers=self.headers)

    @task(4)
    def inital_student_progress(self):
        self.client.get("/api/v1/courses/python-tutorial/student-progress/", headers=self.headers)

    @task(5)
    def concept_page(self):
        self.client.get("/api/v1/courses/python-tutorial/concepts/dictionaries/", headers=self.headers)

    @task(6)
    def make_quiz_attempt(self):
        payload = {
            "answer": "1234",
            "result": False,
            "quizId": "d9a87a5d-89d7-49f9-9692-61f4d60ce0ab",
            "choices": "Nope"
        }
        json_payload = json.dumps(payload)
        url = "/api/v1/quizzes/d9a87a5d-89d7-49f9-9692-61f4d60ce0ab/attempts/"
        response = self.client.post(url, data=json_payload, headers=self.headers)

    @task(7)
    def final_student_progress(self):
        self.client.get("/api/v1/courses/python-tutorial/student-progress/", headers=self.headers)


class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait=5000
    max_wait=9000


