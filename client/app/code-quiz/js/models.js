var _ = require("lib")._;
var Backbone = require("lib").Backbone;
var StreamSaveModel = require("models").StreamSaveModel;
var $ = require("lib").$;
var utils = require("utils");

var EVALUATION_STATES = require("app-constants").CODEQUIZ_EVALUATION_STATES;

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
        if(this.isNew()) {
            return "/api/v1/codequizattempts/{0}/".format(this.attributes.codequizId);
        }
        else {
            return "/api/v1/codequizattempts/{0}/".format(this.attributes.id);
        }
    },

    save: function() {

        var promise = $.Deferred();

        var self = this;
        Backbone.Model.prototype.save.call(this).then(function() {
            self.onResponseReceived(promise);
        });

        return promise;
    },

    onResponseReceived: function(promise) {
        var state = this.attributes.state;
        if(EVALUATION_STATES[state] === "EVALUATED") {
            promise.resolve();

            //reset for next attempt
            delete self.attributes.id;
            delete self.attributes.state;

        }
        else if(EVALUATION_STATES[state] == "EVALUATING") {
            this.pollAttemptResult(promise);
        }
        else {
            utils.assert(False, "Invalid codequiz evaluation state");
        }
    },

    POLL_INTERVAL: 3 * 1000,

    pollAttemptResult: function(promise) {

        var self = this;
        setTimeout(function() {
            self.fetch().then(function() {
                self.onResponseReceived(promise);
            });
        }, this.POLL_INTERVAL);
    }

});

var AttemptCollection = Backbone.Collection.extend({

    initialize: function(models, options) {
        this.conceptId = options.conceptId;
    },

    url: function() {
        return "/api/v1/student/concepts/{0}/codequizattempts/".format(this.conceptId);
    }
});

var AttemptStore = function(options) {
    this._conceptId = options.conceptId;
    if(!options.attemptCollection) {
        this._attemptCollection = new AttemptCollection([], {
            conceptId: options.conceptId
        });
    }
    else {
        this._attemptCollection = options._attemptCollection;
    }
    this._attempts = {};
};

AttemptStore.prototype = {

    isAnswered: function(id) {
        return this._attempts[id] && this._attempts[id].result === true;
    },

    fetch: function() {
        var self = this;
        return this._attemptCollection.fetch().then(function() {
            self.initializeAttempts()
        });
    },

    initializeAttempts: function() {
        this._attemptCollection.each(function(model) {
            var attrs = model.attributes;
            this._attempts[attrs.quizId] = attrs;
        }, this);
    }
};

_.extend(AttemptStore.prototype, Backbone.Events);
AttemptStore.prototype.constructor = AttemptStore;


module.exports = {
    CodeQuizModel: CodeQuizModel,
    CodeQuizAttemptModel: CodeQuizAttemptModel,
    CodeQuizAttemptCollection: AttemptCollection,
    CodeQuizAttemptStore: AttemptStore
};