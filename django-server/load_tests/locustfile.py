import json

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

    @task(2)
    def make_quiz_attempt(self):
        payload = {
            "answer": "1234",
            "result": False,
            "quizId": "f1235486-8e80-47f3-adad-a5db214433d5",
            "choices": "Nope"
        }
        json_payload = json.dumps(payload)
        headers = {
            "X-CSRFToken": self.csrftoken,
            "Cookie": self.cookie,
            "Content-Type": "application/json"
        }
        url = "/api/v1/quizzes/f1235486-8e80-47f3-adad-a5db214433d5/attempts/"
        response = self.client.post(url, data=json_payload, headers=headers)

    @task(1)
    def profile(self):
        response = self.client.get("/api/v1/concepts/e1b3c1d1-363c-46d1-9d58-2e030e6a5828/")
        

class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait=5000
    max_wait=9000
