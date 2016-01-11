var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var md = require("md");
var utils = require("utils");

var Constants = require("app-constants");

var StreamSaveModel = require("models").StreamSaveModel;

var constants = {
    SHORT_ANSWER: 1,
    MCQ: 2,
    CORRECT_FEEDBACK: Constants.QUIZ_FEEDBACK.CORRECT,
    WRONG_FEEDBACK: Constants.QUIZ_FEEDBACK.WRONG,
    QUESTION_PLACEHOLDER: "Enter the Question in Markdown",

    NOT_ATTEMPTED: 0,
    INCORRECTLY_ATTEMPTED: 1,
    ANSWERED: 2
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
var QuizModel = StreamSaveModel.extend({
    
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


var QuizAttemptModel = Backbone.Model.extend({

    url: function() {
        return "/api/v1/quizzes/{0}/attempts/".format(this.attributes.quizId);
    }

});

var QuizAttemptCollection = Backbone.Collection.extend({
    
    model: QuizAttemptModel,

    initialize: function(options) {
        if(options.conceptId) {
            this.conceptId = options.conceptId;
        }
    },

    parse: function(response) {
        var latestAttempts = {};

        //filter latest attempts.
        _.each(response, function(attempt) {
            var previous = latestAttempts[attempt.quizId];
            if(!previous) {
                latestAttempts[attempt.quizId] = attempt;
            }
            else {

                //High level overview. 
                //attemptNumber field is now removed to simplify 
                //logic, and support multiple sessions from same user
                //On the flipside, we have to rely on the database's 
                //created-at time and may lose out info on whether 
                //student answered a question on the first attempt. 

                //Comment specific to below block of code. 
                //Replace an attempt only if it is incorrect. 
                //We want to prioritize correct attempts so that 
                //corresponding UI component is disabled  
                //and an 'answered-correctly' message is shown. 
                if(!previous.result) {
                    latestAttempts[attempt.quizId] = attempt;
                }
            }
        });

        return _.values(latestAttempts);
    },

    url: function() {
        return "/api/v1/student/concepts/{0}/quizattempts/".format(this.conceptId);
    }
});

var QuizAttemptStore = function(options) {
    this.sectionQuizzes = {};
    this.attempts = {};
    
    this.attemptCollection = options.attemptCollection;
    this._channel = options.channel || this;
};

QuizAttemptStore.prototype = {

    addAttempt: function(attempt) {
        console.log("Adding attempt: ", attempt);
        this.attempts[attempt.quizId] = attempt;

        this._channel.trigger("add:attempt", attempt);
        
        var model = this.attemptCollection.add(attempt);
        return model.save();
    },

    getAttempt: function(quizId) {
        var attempt = this.attempts[quizId];
        if(!attempt) {
            return {
                result: null,
                guess: ""
            };
        }
        return attempt;
    },

    isAnswered: function(quizId) {
        return this.getAttempt(quizId).result === true;
    },

    isEmpty: function() {
        return this.attemptCollection.length === 0;
    },

    getSectionAttemptStatuses: function(sectionId) {

        var quizzes = this.sectionQuizzes[sectionId];
        var statuses = {};

        _.each(quizzes, function(q) {
            var attempt = this.attempts[q.id];
            statuses[q.id] = false;
            if(attempt && attempt.result === true) {
                statuses[q.id] = true;
            }
        }, this);

        return statuses;
    },

    fetch: function() {
        return this.attemptCollection.fetch();
    },

    setSectionQuizzes: function(sectionQuizzes) {
        this.sectionQuizzes = sectionQuizzes;
        return this;
    },

    initializeAttempts: function() {
        this.attempts = _.indexBy(this.attemptCollection.toJSON(), "quizId");
        return this;
    },

    cleanup: function() {
        this.attemptCollection.off();
        if(this._channel === this) {
            this.off();
        }
        this.attempts = {}
    }
};

_.extend(QuizAttemptStore.prototype, Backbone.Events);
QuizAttemptStore.prototype.constructor = QuizAttemptStore;


module.exports = {
    constants: constants,
    ShortAnswerSubmitModel: ShortAnswerSubmitModel,
    MCQAnswerModel: ShortAnswerSubmitModel,
    GuessCollection: GuessCollection,
    QuizModel: QuizModel,
    QuizBankCollection: QuizBankCollection,
    QuizAttemptStore: QuizAttemptStore,
    QuizAttemptCollection: QuizAttemptCollection

};

window.QuizModel = QuizModel;