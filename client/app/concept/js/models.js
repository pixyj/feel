var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var appWebSocket = require("app-websocket");
appWebSocket = appWebSocket.appWebSocket;

var WebSocketModel = require("models").WebSocketModel;


var ConceptModel = WebSocketModel.extend({

    defaults: {
        name: "",
        sections: [],
        isPublished: false
    },

    BASE_URL: "/api/v1/concepts/",

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.attributes.id);
    },

});

module.exports = {
    ConceptModel: ConceptModel
};