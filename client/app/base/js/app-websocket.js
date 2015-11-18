var utils = require("utils");
var _ = require("underscore");

var CONNECTING = 0;
var OPEN = 1;
var CLOSING = 2;
var CLOSED = 3;

var AppWebSocket = function() {
    
    this.unsentMessages = [];
    this.unacknowledgedMessagesByURL = {};

    this.retries = 0;

    this._open();

};

AppWebSocket.prototype = {

    save: function(attrs) {
        
        var callback = attrs.onSaved || null;
        var context = attrs.context || window;

        var payload = attrs.payload;
        var url = attrs.url;
        var httpMethod = attrs.httpMethod;

        if(!this._isConnectionActive()) {
            //todo -> handle this case. Maybe by opening a new connection?
            console.error("Connection not opened");
            return;
        }

        var data = {
            payload: payload,
            url: url,
            httpMethod: httpMethod
        };

        var callbackAttrs = {
            callback: callback,
            context:  context
        };

        if(this.connection.readyState === CONNECTING) {
            var messageAttrs = _.extend(data, callbackAttrs);
            this.unsentMessages.push(messageAttrs);
        }
        else {
            var message = JSON.stringify(data);
            this.unacknowledgedMessagesByURL[data.url] = callbackAttrs;
            this.connection.send(message);
        }

    },
    
    _getConnectionURL: function() {
        return "ws://{0}:{1}/websocket".format(window.location.hostname, window.location.port);
    },

    _open: function() {
        
        this.connection = new WebSocket(this._getConnectionURL());
        this._listenToError();
        
        var self = this;
        this.connection.onopen = function() {

            console.log("Opened websocket connection");

            self._listenToServerMessages();
            //Existing unsent messages are sent and `unsentMessages` is reset. 
            //If we fail, `unsavedMessages` will build up again. 
            //Could be useful when retries are implemented. 

            var messages = self.unsentMessages;
            self.unsentMessages = [];
            _.each(messages, function(message) {
                self.send(message);
            });
        }
    },

    _isConnectionActive: function() {
        var state = this.connection.readyState;
        return (state === CONNECTING || state === OPEN);
    },

    _listenToServerMessages: function() {

        var self = this;
        this.connection.onmessage = function(message) {
            var data = JSON.parse(message.data);
            var payload = data.payload;
            
            var callbackAttrs = self.unacknowledgedMessagesByURL[data.url];
            var method = callbackAttrs.callback;

            if(method) {
                var context = callbackAttrs.context;
                method.call(context, payload);
            }
            delete self.unacknowledgedMessagesByURL[data.url];
        };
    },

    _listenToError: function() {

        var self = this;
        this.connection.onerror = function() {
            self.retries += 1;
            var secondsToWait = Math.pow(2, self.retries) * 1000;
            console.log("Will retry opening connection in ", secondsToWait / 1000, "seconds");
            setTimeout(function() {
                self._open();
            }, secondsToWait);
        }
    }

};

AppWebSocket.prototype.constructor = AppWebSocket;

var appWebSocket = new AppWebSocket();

module.exports = {
    appWebSocket: appWebSocket
};