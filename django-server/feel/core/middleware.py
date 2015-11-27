import traceback

class ProcessExceptionMiddleware(object):
    
    def process_exception(self, request, exception):
        # Just print the exception object to stdout
        print(exception)

        # Print the familiar Python-style traceback to stderr
        traceback.print_exc()

