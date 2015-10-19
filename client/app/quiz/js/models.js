var _ = require("underscore");
var Backbone = require("backbone");
var md = require("md");

var constants = {
    SHORT_ANSWER: 1,
    MCQ: 2,
    CORRECT_FEEDBACK: "Correct",
    WRONG_FEEDBACK: "Nope",
    QUESTION_PLACEHOLDER: "Enter the Question in Markdown"
};

var ChoiceModel = Backbone.Model.extend({

    idAttribute: "choiceInput",

    defaults: {
        choiceInput: "",
        choiceDisplay: "",
        isCorrect: false
    }

});

//todo -> figure out where to reset collection and switch off event listeners.
var ChoiceCollection = Backbone.Collection.extend({

    model: ChoiceModel,

    initialize: function() {
        this.on("add", this.listenToModelChange, this);

        //http://stackoverflow.com/a/9137772/817277
        _.defer(_.bind(this.addModelChangeListeners, this)); 

        this.currentModelCid = null;
    },

    addModelChangeListeners: function(model) {
        _.each(this.models, function(model) {
            this.listenToModelChange(model);
        }, this);
    },

    listenToModelChange: function(model) {
        model.on("change:choiceInput", this.addNewEmptyChoice, this);
    },

    addNewEmptyChoice: function(model) {
        console.log("Choice Input:", model.attributes.choiceInput);
        if(this.any({choiceInput: ""})) {
            return;
        }
        this.currentModelCid = model.cid;
        console.log("currentModelCid: ", model.cid);

        //remove duplicates. But if currently being edited model is a duplicate, 
        //don't remove it since it is changing on every keystroke and it could be a substring of a previous choice. 
        //We have to do this since Backbone does not enforce uniqueness 
        //based on `idAttribute` on model.change, but does so only on model.add
        var choiceInputHash = {};
        var modelsToBeRemoved = [];
        _.each(this.models, function(model) {
            var isDupe = !_.isUndefined(choiceInputHash[model.attributes.choiceInput]);
            if(isDupe) {
                if(model.cid !== this.currentModelCid) {
                    modelsToBeRemoved.push(model);
                }
            }
            else {
                choiceInputHash[model.attributes.choiceInput] = model.cid;
            }
        }, this);
        
        this.remove(modelsToBeRemoved);
        this.add({});
    },

    isSingleAnswerCorrect: function() {
        return this.where({isCorrect: true}).length === 1;
    }
});

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
        answer: ""
    },

    initialize: function() {

        if(this.attributes.questionInput.length > 0) {
            this.attributes.questionDisplay = md.mdAndMathToHtml(this.attributes.questionInput);
        }

        var placeholderChoices = [
            {
                choiceInput: ""
            }
        ];
        placeholderChoices.forEach(function(c) {
            c.choiceDisplay = md.mdAndMathToHtml(c.choiceInput);
        });

        //todo -> Change choices to choiceCollection as well. To make things explicit, and consistent. 
        this.choices = new ChoiceCollection(placeholderChoices);

        this.guessCollection = new GuessCollection();

    }

});


var QuizBankCollection = Backbone.Collection.extend({

    model: QuizModel,

    url: "/api/v1/quizzes",

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
        return this._cachedQuizzes;
    }

});


module.exports = {
    constants: constants,
    ChoiceModel: ChoiceModel,
    ChoiceCollection: ChoiceCollection,
    ShortAnswerSubmitModel: ShortAnswerSubmitModel,
    MCQAnswerModel: ShortAnswerSubmitModel,
    GuessCollection: GuessCollection,
    QuizModel: QuizModel,
    QuizBankCollection: QuizBankCollection
};

