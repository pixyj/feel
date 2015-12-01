var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var appWebSocket = require("app-websocket");
appWebSocket = appWebSocket.appWebSocket;

var StreamSaveModel = require("models").StreamSaveModel;


var ConceptModel = StreamSaveModel.extend({

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

var StudentConceptPageModel = Backbone.Model.extend({

    url: function() {
        return "/api/v1/student/concepts/{0}/".format(this.attributes.id)
    }

});

module.exports = {
    ConceptModel: ConceptModel,
    StudentConceptPageModel: StudentConceptPageModel
};