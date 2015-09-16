var constants = {
    SHORT_ANSWER: 1,
    MCQ: 2,
    CORRECT_FEEDBACK: "Correct",
    WRONG_FEEDBACK: "Nope",
    QUESTION_PLACEHOLDER: "Enter the Question in Markdown"
};

var ChoiceModel = Backbone.Model.extend({

    defaults: {
        choiceInput: "",
        choiceDisplay: "",
        
        isCorrect: false
    }

});

var ChoiceCollection = Backbone.Collection.extend({
    model: ChoiceModel
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

        var placeholderChoices = [
            {
                choiceInput: ""
            },
            {
                choiceInput: ""
            }
        ];
        placeholderChoices.forEach(function(c) {
            c.choiceDisplay = mdAndMathToHtml(c.choiceInput);
        });

        //todo -> Change choices to choiceCollection as well. To make things explicit, and consistent. 
        this.choices = new ChoiceCollection(placeholderChoices);

        this.guessCollection = new GuessCollection();

    }

});




var PlanModel = Backbone.Model.extend({

    defaults: {
        planInput: "",
        planDisplay: "",
    },

    //idAttribute: "planInput" -> Well, it's ok to have a plan in mind and not explictly write it, I guess. Especially for new users. 

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


