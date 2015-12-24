var _ = require("underscore");
var Backbone = require("backbone");
var StreamSaveModel = require("models").StreamSaveModel;

var CodeQuizModel = StreamSaveModel.extend({

    defaults: {
        problemStatement: "",
        bootstrapCode: "",
        timeLimit: 5000,
        memoryLimit: 262144,
        testCases: []
    },

    BASE_URL: "/api/v1/codequizzes/",

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.attributes.id);
    },

    result: function() {

    }
});

var CodeQuizAttemptModel = Backbone.Model.extend({

    defaults: {
        code: "",
        result: null,
        outputs: null
    },

    url: function() {
        return "/api/v1/codequizattempts/{0}/".format(this.attributes.codequizId);
    }
});

module.exports = {
    CodeQuizModel: CodeQuizModel,
    CodeQuizAttemptModel: CodeQuizAttemptModel
};