"""
API calls to HackerRank are made asynchronously using grequests, which uses gevent. 
I'm not able to install gevent on Python 3.5. So I'm using Python 2.7 only for this background task.
"""

from gevent import monkey; monkey.patch_all()

import os
import sys

# Hack to include settings path 
DIR_PATH = '/'.join(os.path.abspath(__file__).split("/")[:-2])
sys.path.append(DIR_PATH)

import django
django.setup()

import json
import redis
import requests

from codequiz import conf
REDIS_EVALUATE_CODE_CHANNEL = conf.REDIS_EVALUATE_CODE_CHANNEL
from codequiz.models import CodeQuizAttempt


def evaluate_code(message):
    message = json.loads(message)
    codequiz = CodeQuizAttempt.objects.get(id=message['id'])
    payload = codequiz.create_payload()
    response = requests.post(codequiz.SUBMIT_URL, data=payload)
    return codequiz.parse_response(response)
    


def run():
    r = redis.Redis()
    pubsub = r.pubsub()
    pubsub.subscribe("codequiz:evaluate_code")
    
    for item in pubsub.listen():
        # This is a test message sent by redis on startup
        if item['data'] == 1L:
            continue
        evaluate_code(item['data'])


if __name__ == '__main__':
    run()

