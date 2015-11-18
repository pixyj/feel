var ws = require("ws");
var request = require("request");

// var scribe = require('scribe-js')();
// var express = require("express");

// var app = express();
// app.use('\logs', scribe.webPanel());
// app.listen(8080);
// var console = process.console;


var WebSocketServer = ws.Server;

var wss = new WebSocketServer({port: 5000});

var latestClientMessages = {};

var clientTimers = {};

wss.on("connection", function(client) {

    latestClientMessages[client] = null;
    clientTimers[client] = null;

    client.on("message", function(message) {
        console.log("Received: ", message);
        latestClientMessages[client] = message;
        if(clientTimers[client] === null) {
            var timer = setTimeout(function() {
                var message = latestClientMessages[client];
                console.log("Saving ", message);
                saveMessage(client, message);

                clientTimers[client] = null;
            }, 1000);
            clientTimers[client] = timer;
        }
    });
});

var getCSRFToken = function(cookies) {
    var keyValuePairs = cookies.split(";");
    var length = keyValuePairs.length;
    for(var i = 0; i < length; i++) {
        var keyAndValue = keyValuePairs[i].trim().split("=");
        var key = keyAndValue[0];
        if(key === "csrftoken") {
            return keyAndValue[1];
        }
    }
    return "";
}

var BASE_URL = "http://localhost:7777";

var saveMessage = function(client, stringMessage) {
    var method;
    var message = JSON.parse(stringMessage);

    var url = BASE_URL + message.url;
    var httpMethod = message.httpMethod.toLowerCase();
    
    var requestMethod = request[httpMethod];
    var headers = client.upgradeReq.headers;

    headers['Accept'] = 'application/json';
    headers['Content-Type'] = 'application/json';
    headers['X-CSRFToken'] = getCSRFToken(client.upgradeReq.headers.cookie);

    var options = {
        url: url,
        headers: headers,
        body: JSON.stringify(message.payload)
    }

    //to minimize memory occupied by closure
    _saveMessageImpl(client, options, requestMethod, message.url);
};

var _saveMessageImpl = function(client, options, requestMethod, url) {

    var callback = function(error, response, body) {
        var message = {
            payload: response.body,
            url: url
        };
        client.send(JSON.stringify(message));
    }

    requestMethod(options, callback);
}


