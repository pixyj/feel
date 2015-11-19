var utils = require("utils");
var _ = require("underscore");


var csrfToken = require("csrf").csrfToken;

var CONNECTING = 0;
var OPEN = 1;
var CLOSING = 2;
var CLOSED = 3;

var AppWebSocket = function() {
    
    this.unsentMessages = [];
    this.unacknowledgedMessagesByURL = {};

    this.retries = 0;
    self._retryTimer = null;
    this._open();

};

AppWebSocket.prototype = {

    save: function(attrs) {
        
        var callback = attrs.onSaved || null;
        var context = attrs.context || window;

        var payload = attrs.payload;
        var url = attrs.url;
        var httpMethod = attrs.httpMethod;

        var data = {
            payload: payload,
            url: url,
            httpMethod: httpMethod,
            csrfToken: csrfToken
        };

        var callbackAttrs = {
            callback: callback,
            context:  context
        };

        if(!this._isConnectionActive()) {
            var messageAttrs = _.extend(data, callbackAttrs);
            this.unsentMessages.push(messageAttrs);
            if(this._retryTimer === null) {
                this._open();
            }
            
        }

        else if(this.connection.readyState === CONNECTING) {
            var messageAttrs = _.extend(data, callbackAttrs);
            this.unsentMessages.push(messageAttrs);
        }
        
        else {
            var message = JSON.stringify(data);
            var arr = this.unacknowledgedMessagesByURL[data.url];
            if(!arr) {
                arr = [];
                this.unacknowledgedMessagesByURL[data.url] = arr;
            }
            arr.push(callbackAttrs);
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

            self._cleanupRetryTimer();

            self._listenToServerMessages();
            //Existing unsent messages are sent and `unsentMessages` is reset. 
            //If we fail, `unsavedMessages` will build up again. 
            //Could be useful when retries are implemented. 

            var messages = self.unsentMessages;
            self.unsentMessages = [];
            _.each(messages, function(message) {
                self.save(message);
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
            
            var callbackAttrs = self.unacknowledgedMessagesByURL[data.url][0];
            var method = callbackAttrs.callback;

            if(method) {
                var context = callbackAttrs.context;
                method.call(context, payload);
            }
            else {
                console.warn("WebSocket callback method not specified", callbackAttrs);
            }
            var arr = self.unacknowledgedMessagesByURL[data.url];
            arr.pop();
            if(!arr.length) {
                delete self.unacknowledgedMessagesByURL[data.url];
            }
        };
    },

    _listenToError: function() {

        var self = this;
        this.connection.onerror = function() {
            if(self._retryTimer) {
                return;
            }
            self.retries += 1;
            var secondsToWait = Math.pow(2, self.retries) * 1000;
            console.log("Will retry opening connection in ", secondsToWait / 1000, "seconds");
            var timer = setTimeout(function() {
                self._open();
            }, secondsToWait);
            self._retryTimer = timer;
        }
    },

    _cleanupRetryTimer: function() {
        if(this._retryTimer) {
            clearTimeout(this._retryTimer);    
        }
        this._retryTimer = null;
        self.retries = 0;
    }

};

AppWebSocket.prototype.constructor = AppWebSocket;

var appWebSocket = new AppWebSocket();

module.exports = {
    appWebSocket: appWebSocket
};