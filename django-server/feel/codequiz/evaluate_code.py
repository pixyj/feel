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

import codequiz.models
import logging
logger = logging.getLogger("evaluate_code")


def evaluate_code(message):
    message = json.loads(message)
    attempt = CodeQuizAttempt.objects.get(id=message['id'])
    payload = attempt.create_payload()
    try:
        response = requests.post(attempt.SUBMIT_URL, data=payload)
    except Exception as e:
        logger.error(e)
    else:
        if response.status_code == 200:
            attempt.parse_response(response)
        else:
            logger.error("Code Submission HTTP {} Error", response.status_code)
    


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
    logger.info("Started evaluate code process")
    run()

