import traceback

class ProcessExceptionMiddleware(object):
    
    def process_exception(self, request, exception):
        # Just print the exception object to stdout
        print(exception)

        # Print the familiar Python-style traceback to stderr
        traceback.print_exc()



class JsonAsHtml(object):
    '''
    #http://stackoverflow.com/a/19778011/817277
    View a JSON response in your browser as HTML
    Useful for viewing stats using Django Debug Toolbar 

    This middleware should be place AFTER Django Debug Toolbar middleware   
    '''

    def process_response(self, request, response):
        if 'api' not in request.path:
            return response
        
        title = "JSON as HTML Middleware for: %s" % request.get_full_path()
        response.content = "<html><head><title>%s</title></head><body>%s</body></html>" % (title, response.content)
        response['Content-Type'] = 'text/html'
        return response