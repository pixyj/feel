var ws = require("ws");
var request = require("request");

var WebSocketServer = ws.Server;
var wss = new WebSocketServer({port: 5000});

//handle cleanup. 
var unsentClientMessages = {};
var newMessageURLs = {}; //POST requests not acknowledged by server 

wss.on("connection", function(client) {

    client.toString = function() {

        //returns cookie for the hashing objects in unsentClientMessages. 
        /*
        client.upgradeReq.headers.cookie
        "sessionid=lfmfdl637gdrawvhdyhxk9suydcjte7d; csrftoken=oTjey7CFyePhdcpu05CESu7eGznlTNCl"
        */
        return client.upgradeReq.headers.cookie;
    };

    console.log("Client Connected", client.toString());
    unsentClientMessages[client] = {};

    client.on("message", function(stringMessage) {
        
        console.log("Received message");
        var message = JSON.parse(stringMessage);

        if(message.httpMethod === 'POST') {
            newMessageURLs[message.url] = true;
            saveMessage(client, message);
            return;
        }


        var isSaveMessageScheduled = !(!unsentClientMessages[client][message.url]);
        unsentClientMessages[client][message.url] = message;   
        
        if(!isSaveMessageScheduled) {
            console.log("Scheduling save message");
            scheduleSaveMessage(client, message);    
        } 
        else {
            console.log("Message scheduled already. NOT scheduling save message.");
        }

    });

    client.on("close", function() {
        cleanupClientMessages(client);
        console.log("Client closed", client.toString());
    });
});


var lastScheduledSaveTime = null;
var MAX_PUT_REQUESTS_PER_SECOND = 10;
var MINIMUM_REQUEST_GAP =  1000 / MAX_PUT_REQUESTS_PER_SECOND;

scheduleSaveMessage = function(client, message) {

    var waitFor;
    var now = new Date();
    if(lastScheduledSaveTime === null || (now - lastScheduledSaveTime) > MINIMUM_REQUEST_GAP) {
        waitFor = 0;
        lastScheduledSaveTime = now;
    }
    else {
        var scheduledSaveTime = new Date(lastScheduledSaveTime + MINIMUM_REQUEST_GAP); 
        waitFor = (now - scheduledSaveTime);
        lastScheduledSaveTime = scheduledSaveTime;

    }
    console.log("Next PUT request after ", waitFor, "ms");
    saveMessageWithTimeout(client, message, waitFor);
}


var saveMessageWithTimeout = function(client, message, waitFor) {
    
    setTimeout(function() {
        if(newMessageURLs[message.url]) {
            //Response not received for POST yet. 
            console.log("POST response NOT received for ", message.url, "Rescheduling request");
            scheduleSaveMessage(client, message);
        }
        else {
            saveMessage(client, message);    
        }
        
    }, waitFor);
};

var BASE_URL = "http://localhost:7777";

var saveMessage = function(client, message) {
    var method;
    //console.log("message ", message);

    var url = BASE_URL + message.url;
    var httpMethod = message.httpMethod.toLowerCase();
    
    var requestMethod = request[httpMethod];
    var headers = client.upgradeReq.headers;

    headers['Accept'] = 'application/json';
    headers['Content-Type'] = 'application/json';
    headers['X-CSRFToken'] = message.csrfToken;

    var options = {
        url: url,
        headers: headers,
        body: JSON.stringify(message.payload)
    }

    //to minimize memory occupied by closure
    _saveMessageImpl(client, options, requestMethod, message.url);

    console.log("Saving message and deleting it from buffer", message.url);
    delete unsentClientMessages[client][message.url];
};

var _saveMessageImpl = function(client, options, requestMethod, url) {

    var callback = function(error, response, body) {
        console.log("Saved message: ", url);
        if(newMessageURLs[url]) {
            delete newMessageURLs[url];
            console.log("POST response received for", url, "Ready to send PUT requests");
        }
        var message = {
            payload: response.body,
            url: url
        };

        try {
            client.send(JSON.stringify(message));
        } catch(e) {
            console.log("Unable to send response. Client ", client.toString(), "has closed the connection", e.toString())
        }
    }

    requestMethod(options, callback);
}


var CLIENT_CLEANUP_WAITING_TIME = 30*1000; //30 seconds
var cleanupClientMessages = function(client) {
    var length = Object.keys(unsentClientMessages[client]).length;
    if(!length) {
        delete unsentClientMessages[client];
        console.log("Cleaned up client", client.toString());
    }
    else {
        console.log("Client ", client.toString(), " has unsent messages. Scheduling clean up after ", CLIENT_CLEANUP_WAITING_TIME / 1000 , "seconds");
        scheduleCleanupClientMessages(client);
    }
}

var scheduleCleanupClientMessages = function(client) {
    setTimeout(function(client) {
        cleanupClientMessages(client);
    }, CLIENT_CLEANUP_WAITING_TIME);
}
