var ChoiceModel = Backbone.Model.extend({

    idAttribute: "choiceInput",

    defaults: {
        choiceInput: "",
        choiceDisplay: "",
        isCorrect: false
    }

});

var ChoiceCollection = Backbone.Collection.extend({
    model: ChoiceModel
});

var constants = {
    SHORT_ANSWER: 1,
    MCQ: 2,
    CORRECT_FEEDBACK: "Correct",
    WRONG_FEEDBACK: "Nope",
    QUESTION_PLACEHOLDER: "Enter the Question in Markdown"
};

//#todo -> consider changing answer to short-answer to be more explicit. 
var QuizModel = Backbone.Model.extend({
    
    defaults: {
        quizType: constants.MCQ,
        questionInput: "",
        questionDisplay: "",
        answer: ""
    },

    initialize: function() {

        var placeholderChoices = [
            {
                choiceInput: "Choice 1"
            },
            {
                choiceInput: "Choice 2"
            }
        ];
        placeholderChoices.forEach(function(c) {
            c.choiceDisplay = mdAndMathToHtml(c.choiceInput);
        });

        this.choices = new ChoiceCollection(placeholderChoices);
    }

});

var ShortAnswerSubmitModel = Backbone.Model.extend({
    defaults: {
        guess: null,
        result: null
    }
});

var MCQAnswerModel = ShortAnswerSubmitModel;


var PlanModel = Backbone.Model.extend({

    defaults: {
        planInput: "",
        planDisplay: "",
    },

    idAttribute: "planInput"

});

var PlanCollection = Backbone.Collection.extend({
    
    model: PlanModel

});

var ProblemSolvingModel = Backbone.Model.extend({

    defaults: {
        understandProblemInput: "",
        understandProblemDisplay: "",
        result: null    
    },


    initialize: function() {
        this.plans = new PlanCollection();
    }

});


