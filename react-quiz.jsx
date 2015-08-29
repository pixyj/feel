var converter = Markdown.getSanitizingConverter();


var mdAndMathToHtml = function(s) {
    var r = new RegExp("one", "g");
    var start = new RegExp("\<math\>", "g");
    var end = new RegExp("\</math\>", "g");

    var startTagPosition, endTagPosition;
    startTagPosition = start.exec(s);
    var resultArray = [];
    var inputArray = [];
    var nowIndex = 0;
    while(startTagPosition !== null) {
        
        endTagPosition = end.exec(s);
        //assert(endTagPosition !== null, "no [/math] found for [math] at " + startTagPosition.index);
        var mathExp = s.slice(startTagPosition.index + 6, endTagPosition.index);
        console.log("math expression: ", mathExp);

        var mathHtmlExp = katex.renderToString(mathExp);
        var beforeInput = s.slice(nowIndex, startTagPosition.index);
        before = converter.makeHtml(beforeInput);
        inputArray.push(beforeInput);
        inputArray.push(mathExp);

        resultArray.push(before);
        resultArray.push(mathHtmlExp);
        nowIndex = endTagPosition.index + 7;
        startTagPosition = start.exec(s);
        //console.log("input", inputArray, "result", resultArray);
    }
    var lastInput = s.slice(nowIndex, s.length);
    last = converter.makeHtml(lastInput);
    resultArray.push(last);
    inputArray.push(lastInput);
    //console.log("input", inputArray, "result", resultArray);
    return resultArray.join("");
}

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
    WRONG_FEEDBACK: "Nope"
};

var QuizModel = Backbone.Model.extend({
    
    defaults: {
        quizType: constants.SHORT_ANSWER,
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

var app = {
    quizModel: new QuizModel(),
    eventBus: _.extend({}, Backbone.Events),
};

var ShortAnswerInputView = React.createClass({

    getInitialState: function() {
        var answer = this.props.model.attributes.answer || "";
        return {
            answer: answer
        };
    },
    
    render: function() {
        return(
            <input type="text" placeholder="Expected Answer" onChange={this.updateAnswer} value={this.state.answer} />
        );
    },

    updateAnswer: function(evt) {
        var answer = evt.target.value.trim();
        this.props.model.set({
            answer: answer
        });
        this.setState({
            answer: answer
        });
        console.log("Current State", this.state)
    }

});

var SingleChoiceInputView = React.createClass({

    getInitialState: function() {
        var attrs = this.props.model.attributes;
        return {
            choiceInput: attrs.choiceInput,
            isCorrect: attrs.isCorrect
        }
    },

    render: function() {
        var domId = this.props.model.cid;
        console.log("Choice State", this.state);
        

        return (
            <div className="row">
                <div className="col s1">
                    <form>
                        <input type="checkbox" className="filled-in" id={domId} onChange={this.updateIsCorrect} checked={this.state.isCorrect} />
                        <label htmlFor={domId}></label>
                    </form>
                </div>
                <div className="col s10">
                     <textarea className="quiz-creator-choice-input" ref="textarea" placeholder="Choice"  onKeyUp={this.updateChoiceText} onChange={this.updateChoiceText} value={this.state.choiceInput}/>   
                </div>
                <div className="col s1">
                    <span className="quiz-creator-remove-choice" onClick={this.removeChoice}>X</span>
                </div>
            </div>
        );
    },

    updateChoiceText: function(evt) {

        var choiceInput = evt.target.value;
        var choiceDisplay = mdAndMathToHtml(choiceInput);
        console.log("updating text", choiceInput);
        
        this.props.model.set({
            choiceInput: choiceInput,
            choiceDisplay: choiceDisplay
        });

        this.setState({
            choiceInput: choiceInput
        });

    },

    updateIsCorrect: function(evt) {
        var isCorrect = !this.state.isCorrect;
        this.props.model.set({
            isCorrect: isCorrect
        });

        this.setState({
            isCorrect: isCorrect
        });
    },

    removeChoice: function() {
        this.props.model.collection.remove(this.props.model);
    }
});

var ChoiceCollectionInputView = React.createClass({

    getInitialState: function() {
        return {
            choices: this.props.model.choices.toJSON()
        };
    },

    componentDidMount: function() {
        this.props.model.choices.on("remove", this.updateChoices, this);
    },

    componentWillUnmount: function() {
        this.props.model.choices.off("remove", this.updateChoices);
    },

    render: function() {
        var choices = this.props.model.choices;
        var rows = [];
        for(var i = 0; i < choices.length; i++) {
            var model = choices.at(i);
            var key = model.attributes.choiceInput || model.cid;
            rows.push(<SingleChoiceInputView key={key} model={model} />);
        }

        var plus = "\u2795";
        return (
            <div>
                <button className="btn-floating btn-large waves-effect waves-light red quiz-creator-add-choice" onClick={this.addChoice}>{plus}</button>
                {rows}
            </div>
        );
    },

    addChoice: function() {
        var model = new ChoiceModel();
        this.props.model.choices.add(model);
        this.setState({
            choices: this.props.model.choices.toJSON()
        })
    },

    updateChoices: function() {
        this.setState({
            choices: this.props.model.choices.toJSON()
        })
    }
})

var QuizCreatorView = React.createClass({

    getInitialState: function() {
        var attrs = this.props.model.toJSON(); 
        return attrs;
    },

    render: function() {

        var toggleMessage = this.getToggleMessage();

        var answerInputView;
        if(this.props.model.attributes.quizType === constants.SHORT_ANSWER) {
            answerInputView = <ShortAnswerInputView model={this.props.model} />
        }
        else {
            answerInputView = <ChoiceCollectionInputView model={this.props.model} />
        }

        return (
            <div>
                <h4 className="quiz-creator-input-heading">Quiz</h4>
                <textarea className="quiz-creator-question-input" placeholder="Enter a Question in Markdown" onChange={this.updateQuestionText} onKeyUp={this.updateQuestionText} />                
                
                {answerInputView}

                <button className="quiz-creator-mcq-toggle-button btn" onClick={this.toggleQuizType}>{toggleMessage}</button>
                
            </div>
        );
    },

    updateQuestionText: function(evt) {
        var input = evt.target.value;
        var html = mdAndMathToHtml(input);

        //console.log(html);
        this.props.model.set({
            questionInput: input,
            questionDisplay: html
        });
    },


    getToggleMessage: function() {
        var toggleMessage;
        if(this.props.model.attributes.quizType === constants.SHORT_ANSWER) {
            toggleMessage = "I need an MCQ";
        }
        else {
            toggleMessage = "I need a short-answer quiz";
        }
        return toggleMessage;
    },

    toggleQuizType: function() {
        if(this.props.model.attributes.quizType === constants.SHORT_ANSWER) {
            this.props.model.set({
                quizType: constants.MCQ,
                answer: null
            });
        }
        
        else {
            this.props.model.set({
                quizType: constants.SHORT_ANSWER,
                answer: ""
            });
        }

        this.setState({
            quizType: this.props.model.quizType
        });
    }
});


var ShortAnswerSubmitView = React.createClass({

    getInitialState: function() {
        console.log("Short Answer props", this.props);
        return {
            guess: null
        }
    },

    componentDidMount: function() {
    },

    render: function() {
        return (
            <input type="text" placeholder="Enter your answer here" onKeyUp={this.updateGuess} onChange={this.updateGuess} value={this.state.guess}/>
        );
    },

    updateGuess: function(evt) {
        var guess = evt.target.value.trim();
        this.setState({
            guess: guess
        });
    },

    checkAnswer: function(quizModel) {
        return quizModel.attributes.answer === this.state.guess;
    }
});

var MCQSubmitView = ShortAnswerSubmitView;

var QuizPreview = React.createClass({

    getInitialState: function() {
        
        var attrs = this.props.model.toJSON();
        return attrs;

    },

    componentDidMount: function() {

        console.log("Preview props", this.props);
        this.props.model.on("change:questionDisplay", this.updatePreview, this);
        this.props.model.on("change:quizType", this.updatePreview, this);
        
    },

    componentWillUnmount: function() {
        this.props.model.off("change:questionDisplay", this.updatePreview);
        this.props.model.off("change:quizType", this.updatePreview, this);

    },

    render: function() {
        var html = this.props.model.attributes.questionDisplay || "What are you waiting for?";
        var answerSubmitView;
        if(this.state.quizType === console.SHORT_ANSWER) {
            answerSubmitView = <ShortAnswerSubmitView ref="answerSubmitView" />
        }
        else {
            answerSubmitView = <MCQSubmitView  ref="answerSubmitView" />
        }

        var feedback = this.getResultFeedback();

        return (
            <div>
                <h4 className="quiz-creator-preview-heading">Preview</h4>
                <div className="quiz-question-preview" dangerouslySetInnerHTML={{__html: html}}></div>
                {answerSubmitView}
                <button className="btn waves-effect waves-light" onClick={this.checkAnswer}>Submit</button>
                <span className="quiz-result-feedback"> {feedback} </span>
            </div>
        );  
    },

    getResultFeedback: function() {
        return {
            false: constants.WRONG_FEEDBACK,
            true: constants.CORRECT_FEEDBACK
        }[this.state.result];
    },

    updatePreview: function() {
        console.log("updatePreview called");
        var state = this.props.model.toJSON();
        this.setState(state);
    },

    checkAnswer: function() {
        var submitModel = this.getSubmitModel();
        var result = this.refs.answerSubmitView.checkAnswer(this.props.model);

        this.setState({
            result: result
        });
    },

    getSubmitModel: function() {
        if(this.state.quizType === constants.SHORT_ANSWER) {
            return this.refs.answerSubmitView.props.model;
        }
        else {
            return this.refs.answerSubmitView.props.model;
        }
    }
});


var QuizBox = React.createClass({

    getInitialState: function() {
        return {
            quizModel: app.quizModel,
            shortAnswerModel: new ShortAnswerSubmitModel(),
            mcqAnswerModel: new MCQAnswerModel()
        }
    },

    render: function() {
        return (
            <div className="row">
                <div className="col s6">
                    <QuizCreatorView model={this.state.quizModel}/>
                </div>
                <div className="col s6">
                    <QuizPreview model={this.state.quizModel} shortAnswerModel={this.state.shortAnswerModel} mcqAnswerModel={this.state.mcqAnswerModel} />
                </div>
            </div>
        );
    }
});

React.render(
    <QuizBox />, 
    document.getElementById("page-container")
);


app.eventBus.on("awesome", function() {
    console.log("awesome");
});
