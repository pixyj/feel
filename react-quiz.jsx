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
});


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
                    <h4 className="quiz-creator-preview-heading">Preview</h4>
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
