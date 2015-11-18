var _ = require("underscore");
var Backbone = require("backbone");

var md = require("md");
var utils = require("utils");

var appWebSocket = require("app-websocket");
appWebSocket = appWebSocket.appWebSocket;

var constants = {
    SHORT_ANSWER: 1,
    MCQ: 2,
    CORRECT_FEEDBACK: "Correct",
    WRONG_FEEDBACK: "Nope",
    QUESTION_PLACEHOLDER: "Enter the Question in Markdown"
};

//#todo -> Should I just change it the name to `GuessModel` ?
var ShortAnswerSubmitModel = Backbone.Model.extend({

    idAttribute: "guess",
    
    defaults: {
        guess: null,
        result: null,
        timestamp: null,
        planNumber: null
    }

});

var MCQAnswerModel = ShortAnswerSubmitModel;

var GuessCollection = Backbone.Collection.extend({
    
    model: ShortAnswerSubmitModel,


    initialize: function() {
        this.on("add", this.ifCorrectTriggerAnsweredCorrectlyEvent, this);
    },

    ifCorrectTriggerAnsweredCorrectlyEvent: function(guess) {
        if(guess.attributes.result) {
            this.trigger("answeredCorrectly", guess);
        }
    }

});

//#todo -> consider changing answer to short-answer to be more explicit. 
var QuizModel = Backbone.Model.extend({
    
    defaults: {
        quizType: constants.MCQ,
        questionInput: "",
        questionDisplay: "",
        choices: [],
        answers: [],
        tags: []
    },

    idAttribute: "uuid",

    initialize: function() {
        this._isNew = !this.attributes.uuid;
        if(this._isNew) {
            this.attributes.uuid = utils.uuid();
        }
        this._isSaved = true;
    },

    isNew: function() {
        return this._isNew;
    },

    url: function() {
        var baseURL = "/api/v1/quizzes/";
        if(this.attributes.uuid) {
            return baseURL + this.attributes.uuid + "/";
        }
        else {
            return baseURL;
        }
    },

    toJSON: function() {
        var attrs = Backbone.Model.prototype.toJSON.call(this);
        if(attrs.choices.length) {
            if(attrs.choices[attrs.choices.length-1].choiceInput === "") {
                attrs.choices = attrs.choices.slice(0, attrs.choices.length-1);
            }
        }
        if(attrs.answers.length) {
            if(attrs.answers[attrs.answers.length-1].answer === "") {
                attrs.answers = attrs.answers.slice(0, attrs.answers.length-1);
            }
        }
        return attrs;
    },

    save: function() {
        this._setIsSaved(false);
        appWebSocket.save({
            payload: this.toJSON(),
            url: this.url(),
            httpMethod: this.isNew() ? "POST": "PUT",
            onSaved: this.onSaved,
            context: this 
        });
        this._isNew = false;
    },

    onSaved: function() {
        console.log("Saved quiz");
        this._setIsSaved(true);
    },

    _setIsSaved: function(status) {
        if(this._isSaved !== status) {
            this.trigger("change:isSaved", status);    
        }
        this._isSaved = status;

    }


});


var QuizBankCollection = Backbone.Collection.extend({

    model: QuizModel,

    url: "/api/v1/quizzes/",

    //I can use the parse method providied by Backbone. But I want to explicit now. 
    //Todo -> remove <math> and ---- and other markdown stuff. Or filter it in input.
    cacheQuizInputs: function() {
        this._cachedQuizzes = [];
        _.each(this.toJSON(), function(attrs) {
            attrs.questionInputLowerCase = attrs.questionInput.toLowerCase();
            this._cachedQuizzes.push(attrs);
        }, this);
    },

    getCachedQuizzes: function() {
        return this._cachedQuizzes || [];
    }

});


module.exports = {
    constants: constants,
    ShortAnswerSubmitModel: ShortAnswerSubmitModel,
    MCQAnswerModel: ShortAnswerSubmitModel,
    GuessCollection: GuessCollection,
    QuizModel: QuizModel,
    QuizBankCollection: QuizBankCollection
};

window.QuizModel = QuizModel;