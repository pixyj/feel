var React = require("lib").React;

var models = require("./models");
var constants = models.constants;
var md = require("md");
var utils = require("utils");

var ListMixin = require("list-mixin.jsx").ListMixin;

var SubmitThrottleMixin = require("submit-throttle.jsx").SubmitThrottleMixin;

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
                       id={id} 
                       disabled={this.props.disabled} />
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
        return {
            answer: this.state.guess,
            choices: []
        };
    },

    reset: function() {

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
        var enabled = this.props.disabled ? "" : "quiz-student-choice-enabled";

        var classes = ['md', 'quiz-student-choice waves-effect', selected, enabled].join(" ");
        
        return (
            <div dangerouslySetInnerHTML={{__html: html}} className={classes} onClick={this.toggleSelection} />
        )
    },

    toggleSelection: function() {
        if(this.props.disabled) {
            return;
        }
        this.setState({
            isSelected: !this.state.isSelected
        });
    },

    reset: function() {
        this.setState({
            isSelected: false
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
            var row = <ChoiceSingleCheckView 
                            choice={choice} 
                            key={domId} 
                            ref={domId}
                            disabled={this.props.disabled} />
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
        //#todo -> make the domId thingy and looping DRY. 
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
        return {
            answer: "",
            choices: selectedChoices.join(", ")
        };
    },

    reset: function() {
        var i, length = this.props.store.choices.length;
        for(i = 0; i < length; i++) {
            var domId = "quiz-preview-checkbox-" + i;
            var view = this.refs[domId];
            view.reset();
        }
    }
});

var QuizAnswerSubmitMixin = {

    render: function() {
        var answerSubmitView;
        var result = this.props.result;
        
        if(this.props.store.quizType === constants.SHORT_ANSWER) {
            answerSubmitView = <ShortAnswerSubmitView 
                                    ref="answerSubmitView" 
                                    store={this.props.store} 
                                    disabled={result} />
        }
        else {
            answerSubmitView = <MCQSubmitView  
                                    ref="answerSubmitView" 
                                    store={this.props.store} 
                                    disabled={result} />
        }


        var feedback = this.getResultFeedback();
        var feedbackClass = "quiz-feedback ";
        if(result) {
            feedbackClass += "quiz-correct-result-feedback quiz-status-transition"
        }
        else if(result === false) {
            feedbackClass += "quiz-incorrect-result-feedback"
        }

        var submitDisabledMessage = "";
        if(this.IS_SUBMIT_THROTTLER_MIXED_IN) {
            submitDisabledMessage = this.getSubmitDisabledMessageComponent({
                className: "quiz-submit-disabled-message"
            });
        }

        var isSubmitDisabled = this.isSubmitDisabled();

        return (

            <div>
                {answerSubmitView}
                <div className="row">
                    <div className="col-xs-5 col-md-3">
                        <button className="btn waves-effect waves-light btn-large" 
                                onClick={this.checkAnswer} 
                                disabled={isSubmitDisabled}>
                                Submit
                        </button>
                    </div>
                    <div className="col-xs-7 col-md-9">
                        <span className={feedbackClass}> {feedback} </span>
                    </div>
                </div>
                { submitDisabledMessage }
            </div>

        );
    },

    //todo -> rename function. It does more that what its name suggests (Submits answer to guessCollection)
    checkAnswer: function() {
        
        var result = this.refs.answerSubmitView.checkAnswer();

        var attempt = _.extend({
            result: result,
            quizId: this.props.store.id
        }, this.refs.answerSubmitView.getCurrentGuess());

        this.props.attemptStore.addAttempt(attempt);

        this.props.parent.setState({
            result: result
        });

        if(this.onAnswerSubmitted && _.isFunction(this.onAnswerSubmitted)) {
            this.onAnswerSubmitted.call(this, result);
        }

    },

    getResultFeedback: function() {
        return {
            false: constants.WRONG_FEEDBACK,
            true: constants.CORRECT_FEEDBACK,
            null: ""
        }[this.props.result];
    }

};

var QuizAnswerSubmitView = React.createClass({

    mixins: [SubmitThrottleMixin, QuizAnswerSubmitMixin],

    IS_SUBMIT_THROTTLER_MIXED_IN: true,

    componentWillUnmount: function() {
        this.cleanupThrottler();
    },

    getInitialState: function() {
        return this.initThrottler();
    },

    isSubmitDisabled: function() {
        return this.props.result || this.state.submitDisabled;
    },

    onAnswerSubmitted: function(result) {
        if(!result) {
            this.disableSubmit();
            this.refs.answerSubmitView.reset();
        }
    }

});

var CoursePretestQuizAnswerSubmitView = React.createClass({
    
    mixins: [QuizAnswerSubmitMixin],

    isSubmitDisabled: function() {
        return this.props.result !== null;
    }
});

var QuizQuestionView = React.createClass({


    render: function() {
        var html = this.props.questionDisplay || constants.QUESTION_PLACEHOLDER;

        return (
            <div className="quiz-question-preview md" dangerouslySetInnerHTML={{__html: html}}></div>
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
            </div>
        );  
    }

});


var StudentSingleQuizAttemptComponent = React.createClass({

    getInitialState: function() {
        var state = this.props.attemptStore.getAttempt(this.props.quiz.id);
        console.log("attempt state", state);
        return state;
    },

    componentDidMount: function() {
        this.props.attemptStore.on("add:attempt", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.attemptStore.off("add:attempt", this.updateState);
    },

    render: function() {
        
        var result = this.state.result;
        var className = "student-quiz-attempt-status ";
        
        if(result) {
            className += "student-quiz-correct-status quiz-status-transition";
        }
        else {
            className += "student-quiz-not-correct-status quiz-status-transition";
        }

        return <span className={className}>✓</span>
    },

    updateState: function() {
        this.setState(this.getInitialState());
    }
});


var StudentSingleQuizView = React.createClass({

    getInitialState: function() {
        var result = this.props.attemptStore.getAttempt(this.props.quiz.id).result;
        console.log("Quiz: ", this.props.quiz.id, "Result: ", result);
        return {
            result: result
        }
    },

    getQuizAnswerSubmitComponent: function(options) {
        if(this.props.isCoursePretestQuiz) {
            return <CoursePretestQuizAnswerSubmitView {...options} />
        }
        else {
            return <QuizAnswerSubmitView {...options} />
        }
    },


    render: function() {

        var submitStore = {};
        // hack - getInitialState is called only once per component. 
        //Since the same component is used to show different quizzes by the parent, 
        //we have a problem where the state is not updated. Hence, this hack. 
        //We should move the state to the parent. #todo
        
        var result = this.getInitialState().result;  

        //number is optional. For example, it's not needed in the course pretest. 
        var number = "";
        if(this.props.number) {
            number = this.props.number + ".";
        }
        
        var answerSubmitView = this.getQuizAnswerSubmitComponent({
            store: this.props.quiz,
            attemptStore: this.props.attemptStore,
            parent: this,
            result: result
        });

        return (
            <div id={"quiz-" + this.props.quiz.id}>
                <div className="student-quiz-container">
                    
                    <div className="student-quiz-number">
                        <p>{number}</p>
                    </div>

                    <div className="student-quiz-body">
                        <QuizQuestionView 
                            questionDisplay={this.props.quiz.questionDisplay} 
                            ref="questionView" />
                        {answerSubmitView}
                    </div>
                    
                    <div className="clearfix"> </div>

                </div>
                <hr className="student-quiz-end-line" />
            </div>
        );  
    }

});


var StudentQuizAttemptListComponent = React.createClass({

    render: function() {
        var quizzes = this.props.section.data.quizzes;
        var length = quizzes.length;
        
        if(length <= 1) {
            return <div></div>
        }

        var components = [];
        for(var i = 0; i < length; i++) {
            var attempt = <StudentSingleQuizAttemptComponent 
                                attemptStore={this.props.attemptStore}
                                quiz={quizzes[i]} 
                                key={i} />
            components.push(attempt);
        }
        return (
            <div className="student-quiz-attempt-list"> 
                {components} 
            </div>
        );
    }
});


var StudentQuizView = React.createClass({

    mixins: [ListMixin],

    _buildProps: function(quiz, i) {
        return {
            quiz: quiz,
            parent: this,
            attemptStore: this.props.attemptStore,
            number: i + 1
        };
    },

    render: function() {
        
        var quizzes = this.props.section.data.quizzes;
        var components = this.createList({
            ComponentClass: StudentSingleQuizView,
            collection: quizzes,
            buildProps: this._buildProps
        });

        return (
            <div>
                {components}
            </div>
        );
    }

});


var QuizSectionMixin = {

    render: function() {

        return (
            <div className="card quiz-student-section">
                <h5> {this.getHeading()} </h5>
                <StudentQuizView section={this.props.section} 
                    attemptStore={this.props.attemptStore} />
                <StudentQuizAttemptListComponent section={this.props.section} 
                    attemptStore={this.props.attemptStore} />
            </div>
        );
    }
};

var StudentPrereqQuizSection = React.createClass({

    mixins: [QuizSectionMixin],

    getHeading: function() {
        return "Take this pretest to check if you're ready to learn {0}".format(this.props.page.name);
    }

});

var StudentQuizSection = React.createClass({

    mixins: [QuizSectionMixin],

    getHeading: function() {
        return "Test your understanding";
    }

});

var StudentExitQuizSection = React.createClass({

    mixins: [QuizSectionMixin],

    getHeading: function() {
        return "Answer these questions and you'll be done!";
    }

});

module.exports = {
    QuizPreview: QuizPreview,
    StudentQuizView: StudentQuizView,
    StudentPrereqQuizSection: StudentPrereqQuizSection,
    StudentQuizSection: StudentQuizSection,
    StudentExitQuizSection: StudentExitQuizSection,
    StudentSingleQuizView: StudentSingleQuizView
}