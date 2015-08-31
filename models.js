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

var QuizModel = Backbone.Model.extend({
    
    defaults: {
        quizType: constants.MCQ,
        questionInput: "",
        questionDisplay: "",
        answer: ""
    },

    initialize: function() {
        this.choices = new ChoiceCollection();
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
        guess: null,
        result: null,
        when: null,       
    }

});

var PlanCollection = Backbone.Model.extend({
    model: PlanModel
});

var ProblemSolvingModel = Backbone.Model.extend({

    defaults: {
        understandProblemInput: "",
        understandProblemDisplay: "",
        result: null    
    },


    initialize: function() {
        this.planCollection = new PlanCollection();
    }

});
