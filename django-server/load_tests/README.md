### Run some basic load testing using Locust. 

As of now, the test creates several clients according to the values entered in the Web interface. For each client, the test: 

1. Creates an anonymous user session.
2. Makes a get request for a concept page. 
3. Makes a quiz attempt. 

#### Installation: 

**Use Python 2.7 here since Locust does not support Python 3**

    mkvirtualenv feel_load_tests
    pip install -r requirements.txt


#### Usage: 

    locust --host=<Your_host> 

Open the browser [http://localhost:8089](http://localhost:8089) and run the tests!


