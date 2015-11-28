var _ = require("underscore");
var Backbone = require("backbone");

var md = require("md");
var utils = require("utils");

var appWebSocket = require("app-websocket");
appWebSocket = appWebSocket.appWebSocket;

var WebSocketModel = require("models").WebSocketModel;

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

//#todo -> consider changing answers to short-answers to be explicit. 
var QuizModel = WebSocketModel.extend({
    
    defaults: {
        quizType: constants.MCQ,
        questionInput: "",
        questionDisplay: "",
        choices: [],
        answers: [],
        tags: []
    },

    BASE_URL: "/api/v1/quizzes/",

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

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.attributes.id);
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