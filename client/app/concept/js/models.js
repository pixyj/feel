var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var appWebSocket = require("app-websocket");
appWebSocket = appWebSocket.appWebSocket;

var WebSocketModel = require("models").WebSocketModel;


var ConceptModel = WebSocketModel.extend({

    defaults: {
        name: "",
        sections: []
    },

    BASE_URL: "/api/v1/concepts/"

});

module.exports = {
    ConceptModel: ConceptModel
};