from algoliasearch import algoliasearch

from django.conf import settings

APP_ID = settings.ALGOLIA['APP_ID']
SECRET_KEY = settings.ALGOLIA['SECRET_KEY']


def _get_client():
    return algoliasearch.Client(APP_ID, SECRET_KEY)


def add_objects_to_index(index_name, objects):
    client = _get_client()
    index = client.init_index(index_name)
    return index.add_objects(objects)


def delete_index(index_name):
    client = _get_client()
    return client.delete_index(index_name)


def search_index(index_name, query):
    client = _get_client()
    index = client.init_index(index_name)
    return index.search(query)

