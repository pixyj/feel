var Backbone = require("backbone");
var _ = require("underscore");

var appWebSocket = require("app-websocket").appWebSocket;

var UserModel = Backbone.Model.extend({

    defaults: {
        isAnonymous: true
    },

    url: function() {
        return "/api/v1/user/"
    },

    isAuthenticated: function() {
        return !this.attributes.isAnonymous;
    }
});

var WebSocketModel = Backbone.Model.extend({

    BASE_URL: null,

    initialize: function() {
        this._isSaved = true;
        this._waitingForPostResponse = false;
        //this._triggerIsSavedChanged = _.debounce(this._triggerIsSavedChanged, 1000, {immedate: false});
    },

    /*  Here's a nice blog post on implementing auto save: 
        engineering.hackerearth.com/2014/01/21/introducing-codeplayer/
        But I want to save immediately instead of waiting since the data is critical 
        and perform the compaction/batching on the server.

        On the flip side, I've to run an additional websocket server process. 
        
        Other options:
        1. Use django-websocket 
        2. Use websockets using asyncio. 

        But these libraries aren't as mature as Node. 

        So I'll keep the current
        design for now and think of alternate solutions in the background.  
    */
    save: function() {

        //If response to POST request is not received yet, wait. 
        if(this.isNew() && !this.isSaved()) {
            this._waitingForPostResponse = true;
            return;
        }

        this._setIsSaved(false);
        appWebSocket.save({
            payload: this.toJSON(),
            url: this.url(),
            httpMethod: this.isNew() ? "POST": "PUT",
            onSaved: this.onResponseReceived,
            context: this 
        });
    },

    onResponseReceived: function(payload, statusCode) {
        if(statusCode === 200 || statusCode === 201) {
            this.attributes.id = JSON.parse(payload).id;
            console.info("Saved WebSocketModel");
            if(this._waitingForPostResponse) {
                this._waitingForPostResponse = false;
                this.save();
                return;
            }
            this._setIsSaved(true);
            this.trigger("sync", this);  
        }
        else {
            throw new Error("Websocket message not saved", statusCode, this.attributes);
        }
    },

    isSaved: function() {
        return this._isSaved;
    },

    _setIsSaved: function(status) {
        this._isSaved = status;
        this._triggerIsSavedChanged();

    },

    _triggerIsSavedChanged: function() {
        console.info("isSaved changed");
        this.trigger("change:isSaved", this._isSaved);
    }
});

module.exports = {
    UserModel: UserModel,
    WebSocketModel: WebSocketModel
};