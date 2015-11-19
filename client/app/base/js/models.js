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
        this._isNew = !this.attributes.uuid;
        if(this._isNew) {
            this.attributes.uuid = utils.uuid();
        }
        this._isSaved = true;
    },

    url: function() {
        if(!this.BASE_URL) {
            throw new Error("BASE_URL not specified", this, this.attributes);
        }
        return this.BASE_URL + this.attributes.uuid + "/";
    },

    save: function() {

    },

    isNew: function() {
        return this._isNew;
    },

    save: function() {
        this._setIsSaved(false);
        appWebSocket.save({
            payload: this.toJSON(),
            url: this.url(),
            httpMethod: this.isNew() ? "POST": "PUT",
            onSaved: this.onResponseReceived,
            context: this 
        });
        this._isNew = false;
    },

    onResponseReceived: function(payload, statusCode) {
        if(statusCode === 200 || statusCode === 201) {
            console.log("Saved WebSocketModel");
            this._setIsSaved(true);  
        }
        else {
            throw new Error("Websocket message not saved", statusCode, this.attributes);
        }
    },

    _setIsSaved: function(status) {
        if(this._isSaved !== status) {
            this.trigger("change:isSaved", status);    
        }
        this._isSaved = status;

    }
});

module.exports = {
    UserModel: UserModel
};