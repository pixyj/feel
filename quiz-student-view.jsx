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

    render: function() {
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
                {answerSubmitView}
                <button className="btn waves-effect waves-light btn-large" onClick={this.checkAnswer}>Submit</button>
                <span className="quiz-result-feedback"> {feedback} </span>
            </div>

        );
    },

    checkAnswer: function() {
        var submitModel = this.refs.answerSubmitView.props.model;
        var result = this.refs.answerSubmitView.checkAnswer(this.props.model);

        this.setState({
            result: result
        });
    },

    getResultFeedback: function() {
        return {
            false: constants.WRONG_FEEDBACK,
            true: constants.CORRECT_FEEDBACK,
            null: ""
        }[this.state.result];
    },


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
        var html = this.props.model.attributes.questionDisplay || constants.QUESTION_PLACEHOLDER;

        return (
            <div>
                
                <div className="quiz-question-preview" dangerouslySetInnerHTML={{__html: html}}></div>
                <QuizAnswerSubmitView model={this.props.model} />

            </div>
        );  
    },

    updatePreview: function() {
        console.log("updatePreview called");
        var state = this.props.model.toJSON();
        this.setState(state);
    }


});