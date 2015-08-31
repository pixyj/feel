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
        var answer = evt.target.value;
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

    componentDidMount: function() {
        this.focus();
    },

    render: function() {
        var domId = this.props.model.cid;
        //console.log("Choice State", this.state);
        

        return (
            <div className="row">
                <div className="col s1">
                    <form>
                        <input type="checkbox" 
                               className="filled-in" 
                               id={domId} onChange={this.updateIsCorrect} 
                               checked={this.state.isCorrect}
                               ref="input" />

                        <label htmlFor={domId}></label>
                    </form>
                </div>
                <div className="col s10">
                     <textarea  className="quiz-creator-choice-input" 
                                ref="textarea" placeholder="Choice"  
                                onKeyUp={this.updateChoiceText} 
                                onChange={this.updateChoiceText} 
                                value={this.state.choiceInput} 
                                onKeyDown={this.checkIfCtrlEnterPressedAndAddChoice} />   
                </div>
                <div className="col s1">
                    <span className="quiz-creator-remove-choice" onClick={this.removeChoice}>X</span>
                </div>
            </div>
        );
    },

    focus: function() {
        this.refs.input.getDOMNode().focus();
        return this;
    },

    updateChoiceText: function(evt) {

        var choiceInput = evt.target.value;
        var choiceDisplay = mdAndMathToHtml(choiceInput);
        //console.log("updating text", choiceInput);
        
        this.props.model.set({
            choiceInput: choiceInput,
            choiceDisplay: choiceDisplay
        });

        this.setState({
            choiceInput: choiceInput
        });

    },

    checkIfCtrlEnterPressedAndAddChoice: function(evt) {
        if(evt.ctrlKey && evt.keyCode === 13) {
            console.log("Awesome");
            this.props.parent.addChoice();
        }
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
        var latestElement = null;
        for(var i = 0; i < choices.length; i++) {
            var model = choices.at(i);
            var key = model.attributes.choiceInput || model.cid;
            latestElement = <SingleChoiceInputView key={key} model={model} parent={this}/>
            rows.push(latestElement);
        }
        this.latestElement = latestElement;

        return (
            <div>
                <button className="btn waves-effect waves-light quiz-creator-add-choice" onClick={this.addChoice}>
                    Add Choice
                </button>

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

    checkIfCtrlEnterPressedAndAddChoice: function(evt) {
        var x = 1;
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
                <textarea className="quiz-creator-question-input" placeholder={constants.QUESTION_PLACEHOLDER} onChange={this.updateQuestionText} onKeyUp={this.updateQuestionText} />                
                
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

        this.props.model.choices.reset();

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

var ChoiceSingleCheckView = React.createClass({

    getInitialState: function() {
        return {
            isSelected: false
        }
    },

    render: function() {

        var html = this.props.choice.choiceDisplay;

        if(!html) {
            html = "New Choice"
        }

        var selectedClass = "quiz-student-choice-selected";
        var notSelectedClass = "quiz-student-choice-not-selected"
        var selected = this.state.isSelected ? selectedClass : notSelectedClass;

        var classArray = ['quiz-student-choice', selected];
        var classes = classArray.join(" ");

        return (
            <div dangerouslySetInnerHTML={{__html: html}} className={classes} onClick={this.toggleSelection} />
        )
    },

    toggleSelection: function() {
        this.setState({
            isSelected: !this.state.isSelected
        })
    },

    checkAnswer: function(isCorrect) {
        return this.state.isSelected === isCorrect;
    }

});

var MCQSubmitView = React.createClass({
    
    getInitialState: function() {
        return {
            choices: this.props.choices.toJSON()
        }
    },

    componentDidMount: function() {
        this.props.choices.on("change", this.updateChoices, this);
        this.props.choices.on("add", this.updateChoices, this);
        this.props.choices.on("remove", this.updateChoices, this);
    },

    render: function() {

        var rows = [];
        var length = this.state.choices.length;
        for(var i = 0; i < length; i++) {
            var choice = this.state.choices[i];
            var domId = "quiz-preview-checkbox-" + i;
            var row = <ChoiceSingleCheckView choice={choice} key={domId} ref={domId}/>
            rows.push(row);
        }
        return (
            <div>
                {rows}
            </div>
        );
    },

    updateChoices: function() {
        this.setState({
            choices: this.props.choices.toJSON()
        })
    },

    checkAnswer: function() {
        var wrongFound = false; 
        var i, length = this.props.choices.length;

        //#todo -> make the domId thingy DRY. 
        for(i = 0; i < length; i++) {
            var domId = "quiz-preview-checkbox-" + i;
            var view = this.refs[domId];
            wrongFound = !view.checkAnswer(this.state.choices[i].isCorrect);
            if(wrongFound) {
                break;
            }
        }

        return !wrongFound;
    }
});

var QuizPreview = React.createClass({

    getInitialState: function() {
        
        var attrs = this.props.model.toJSON();
        return attrs;

    },

    componentDidMount: function() {


        this.props.model.on("change:questionDisplay", this.updatePreview, this);
        this.props.model.on("change:quizType", this.updatePreview, this);

    },

    componentWillUnmount: function() {
        this.props.model.off("change:questionDisplay", this.updatePreview);
        this.props.model.off("change:quizType", this.updatePreview, this);


    },

    render: function() {
        var html = this.props.model.attributes.questionDisplay || constants.QUESTION_PLACEHOLDER;
        var answerSubmitView;
        if(this.state.quizType === constants.SHORT_ANSWER) {
            answerSubmitView = <ShortAnswerSubmitView ref="answerSubmitView" />
        }
        else {
            answerSubmitView = <MCQSubmitView  ref="answerSubmitView" choices={this.props.model.choices}/>
        }

        var feedback = this.getResultFeedback();

        return (
            <div>
                <h4 className="quiz-creator-preview-heading">Preview</h4>
                <div className="quiz-question-preview" dangerouslySetInnerHTML={{__html: html}}></div>
                {answerSubmitView}
                <button className="btn waves-effect waves-light btn-large" onClick={this.checkAnswer}>Submit</button>
                <span className="quiz-result-feedback"> {feedback} </span>
            </div>
        );  
    },

    getResultFeedback: function() {
        return {
            false: constants.WRONG_FEEDBACK,
            true: constants.CORRECT_FEEDBACK,
            null: ""
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
                <div className="col s6 quiz-page-split-column quiz-creator-container">
                    <QuizCreatorView model={this.state.quizModel}/>
                </div>
                <div className="col s6 quiz-page-split-column quiz-student-container">
                    <QuizPreview model={this.state.quizModel} shortAnswerModel={this.state.shortAnswerModel} mcqAnswerModel={this.state.mcqAnswerModel} />
                </div>
            </div>
        );
    }
});


var init = function() {

    React.render(
        <QuizBox />, 
        document.getElementById("page-container")
    );

};

init();
