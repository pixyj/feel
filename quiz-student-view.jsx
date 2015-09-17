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
            <input type="text" 
                   placeholder="Enter your answer here" 
                   onKeyUp={this.updateGuess} 
                   onChange={this.updateGuess} 
                   className="quiz-student-short-answer-input"
                   value={this.state.guess}/>
        );
    },

    updateGuess: function(evt) {
        var guess = evt.target.value;
        this.setState({
            guess: guess
        });

    },

    checkAnswer: function(quizModel) {
        return quizModel.attributes.answer === this.state.guess.trim();
    },

    getCurrentGuess: function() {
        return this.state.guess;
    }
});

var ChoiceSingleCheckView = React.createClass({

    getInitialState: function() {
        return {
            isSelected: false
        }
    },

    render: function() {

        var html = this.props.choice.choiceDisplay || "New Choice";

        if(!isWrappedByPTag(html)) {
            html = "<p>" + html + "</p>";
        };

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
            <div className="quiz-student-choice-container">
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
    },

    getCurrentGuess: function() {

        var selectedChoices = [];

        var i, length = this.props.choices.length;
        for(i = 0; i < length; i++) {
            var domId = "quiz-preview-checkbox-" + i;
            var view = this.refs[domId];
            if(view.state.isSelected) {
                selectedChoices.push(view.props.choice.choiceInput);
            }
        }
        if(selectedChoices.length < 2) {
            return selectedChoices.join("") || "Trick question! None of the options are correct";
        }

        return selectedChoices.join(", ");
    }
});

var QuizAnswerSubmitView = React.createClass({

    getInitialState: function() {
        return this.props.model.toJSON();
    },

    componentDidMount: function() {

        this.props.model.on("change:quizType", this.updatePreview, this);
    },

    componentWillUnmount: function() {

        this.props.model.off("change:quizType", this.updatePreview, this);

    },

    updatePreview: function() {
        var state = this.props.model.toJSON();
        this.setState(state);
    },

    render: function() {
        var answerSubmitView;
        if(this.state.quizType === constants.SHORT_ANSWER) {
            answerSubmitView = <ShortAnswerSubmitView ref="answerSubmitView" model={this.props.model}/>
        }
        else {
            answerSubmitView = <MCQSubmitView  ref="answerSubmitView" choices={this.props.model.choices}/>
        }

        var feedback = this.getResultFeedback();

        return (

            <div>
                {answerSubmitView}
                <button className="btn waves-effect waves-light btn-large" onClick={this.checkAnswer}>Submit</button>
                <span className="quiz-result-feedback"> {feedback} </span>
            </div>

        );
    },

    //todo -> rename function. It does more that what its name suggests (Submits answer to guessCollection)
    checkAnswer: function() {
        var submitModel = this.refs.answerSubmitView.props.model;
        var result = this.refs.answerSubmitView.checkAnswer(this.props.model);

        this.setState({
            result: result
        });

        this.addGuessToCollection({
            result: result,
            guess: this.refs.answerSubmitView.getCurrentGuess()
        });
    },

    getResultFeedback: function() {
        return {
            false: constants.WRONG_FEEDBACK,
            true: constants.CORRECT_FEEDBACK,
            null: ""
        }[this.state.result];
    },

    addGuessToCollection: function(attrs) {
        attrs.timestamp = getUTCDate().getTime();
        attrs.planNumber = this.props.planNumber || null;
        this.props.model.guessCollection.add(attrs);
    }

});

var QuizQuestionView = React.createClass({

    getInitialState: function() {
        return {
            questionDisplay: null
        };
    },

    shouldComponentUpdate: function() {
        return true;
    },  


    render: function() {
        var html = this.props.questionDisplay || this.state.questionDisplay || constants.QUESTION_PLACEHOLDER;

        return (
            <div className="quiz-question-preview" dangerouslySetInnerHTML={{__html: html}}></div>
        );
    }
});

var QuizPreview = React.createClass({

    getInitialState: function() {

        var attrs = this.props.model.toJSON();
        return attrs;

    },

    componentDidMount: function() {

        this.props.model.on("change:questionDisplay", this.updatePreview, this);

    },

    componentWillUnmount: function() {
        this.props.model.off("change:questionDisplay", this.updatePreview);
    },

    render: function() {

        return (
            <div>
                
                <QuizQuestionView questionDisplay={this.props.model.questionDisplay} ref="questionView" />
                
                <QuizAnswerSubmitView model={this.props.model} />

            </div>
        );  
    },

    updatePreview: function() {
        //console.log("updatePreview called");
        this.refs.questionView.setState({
            questionDisplay: this.props.model.attributes.questionDisplay
        });
    }


});