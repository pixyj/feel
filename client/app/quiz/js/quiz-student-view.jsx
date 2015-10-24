var React = require("react");

var models = require("./models");
var constants = models.constants;
var md = require("md");
var utils = require("utils");

var ShortAnswerSubmitView = React.createClass({

    getInitialState: function() {
        return {
            guess: null
        }
    },

    render: function() {
        var id = "input-" + utils.getUniqueId();
        return (
            <div className="input-field">
                <input type="text" 
                       onChange={this.updateGuess} 
                       className="quiz-student-short-answer-input"
                       value={this.state.guess || ""} 
                       id={id} />
                <label htmlFor={id}>Your answer</label>
            </div>
        );
    },

    updateGuess: function(evt) {
        var guess = evt.target.value || "";
        this.setState({
            guess: guess
        });

    },

    checkAnswer: function() {
        var guess = (this.state.guess || "").trim();
        var answeredCorrectly = false;

        var i;
        var answers = this.props.store.answers;
        var length = answers.length;
        for(i = 0; i < length; i++) {
            var a = answers[i].answer.trim();
            if(a == guess) {
                answeredCorrectly = true;
                break;
            }
        }
        return answeredCorrectly;
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

        if(!md.isWrappedByPTag(html)) {
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
        });
    },

    checkAnswer: function(isCorrect) {
        return this.props.choice.isCorrect === this.state.isSelected;
    }

});

var MCQSubmitView = React.createClass({
    
    render: function() {

        var rows = [];
        var length = this.props.store.choices.length;
        for(var i = 0; i < length; i++) {
            var choice = this.props.store.choices[i];
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

    //Seeing the code after a few days -> WTF What's up with the wrong found?
    checkAnswer: function() {
        var wrongFound = false; 

        var i, length = this.props.store.choices.length;
        //#todo -> make the domId thingy DRY. 
        for(i = 0; i < length; i++) {
            var domId = "quiz-preview-checkbox-" + i;
            var view = this.refs[domId];
            wrongFound = !view.checkAnswer();
            if(wrongFound) {
                break;
            }
        }

        return !wrongFound;
    },

    getCurrentGuess: function() {

        var selectedChoices = [];

        var i, length = this.props.store.choices.length;
        for(i = 0; i < length; i++) {
            var domId = "quiz-preview-checkbox-" + i;
            var view = this.refs[domId];
            if(view.state.isSelected) {
                selectedChoices.push(view.props.choice.choiceInput); //todo -> change to choice display?
            }

        }
        if(selectedChoices.length < 2) {
            return selectedChoices.join("") || "Trick question! None of the options are correct";
        }

        return selectedChoices.join(", ");
    }
});

var QuizAnswerSubmitView = React.createClass({

    render: function() {
        var answerSubmitView;
        if(this.props.store.quizType === constants.SHORT_ANSWER) {
            answerSubmitView = <ShortAnswerSubmitView ref="answerSubmitView" store={this.props.store}/>
        }
        else {
            answerSubmitView = <MCQSubmitView  ref="answerSubmitView" store={this.props.store}/>
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
        // return {
        //     false: constants.WRONG_FEEDBACK,
        //     true: constants.CORRECT_FEEDBACK,
        //     null: ""
        // }[this.state.result];
    },

    addGuessToCollection: function(attrs) {
        // attrs.timestamp = utils.getUTCDate().getTime();
        // attrs.planNumber = this.props.planNumber || null;
        // this.props.model.guessCollection.add(attrs);
    }

});

var QuizQuestionView = React.createClass({


    render: function() {
        var html = this.props.questionDisplay || constants.QUESTION_PLACEHOLDER;

        return (
            <div className="quiz-question-preview" dangerouslySetInnerHTML={{__html: html}}></div>
        );
    }
});

var QuizPreview = React.createClass({

    getInitialState: function() {
        return {
            questionDisplay: this.props.store.questionDisplay,

        }
    },  

    render: function() {

        return (
            <div>
                
                <QuizQuestionView questionDisplay={this.props.store.questionDisplay} ref="questionView" />
                <QuizAnswerSubmitView store={this.props.store} submitStore={this.props.submitStore} />
                

            </div>
        );  
    }


});

module.exports = {
    QuizPreview: QuizPreview
}