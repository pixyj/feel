var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var models = require("./models");
var constants = models.constants;
var QuizPreview = require("./quiz-student-view.jsx").QuizPreview;

var tags = require("tags.jsx");
var md = require("md");

var TagListBaseView = tags.TagListBaseView;


var ShortAnswerInputView = React.createClass({

    
    render: function() {
        var answer = this.props.store.answers[this.props.index];
        var placeholder;
        if(this.props.index === 0) {
            placeholder = "Expected answer";
        }
        else {
            placeholder = "Add another valid answer"
        }
        return(
            <input type="text" placeholder={placeholder} onChange={this.updateAnswer} value={answer.answer} />
        );
    },

    updateAnswer: function(evt) {
        var answerValue = evt.target.value;

        var answersNew = _.clone(this.props.store.answers);
        var answer = answersNew[this.props.index];
        answer.answer = answerValue;

        if(answerValue && answerValue.length) {
            if(answersNew[answersNew.length-1].answer !== "") {
                answersNew.push({answer: ""})    
            }
            
        }
        this.props.store.setState({
            answers: answersNew
        });
    }

});

var ShortAnswerListView = React.createClass({

    render: function() {

        var answers = this.props.store.answers;
        var length = answers.length;

        if(answers.length === 0) {
            return (
                <div>
                    <button className="btn waves-effect waves-light quiz-creator-add-choice" onClick={this.addAnswer}>
                        Add Answer
                    </button>
                </div>
            );
        };

        var rows = [];
        for(var i = 0; i < length; i++) {
            var key = i;
            var view = <ShortAnswerInputView 
                                index={i}
                                key={key} 
                                store={this.props.store} 
                                parent={this} />

            rows.push(view);
        }
        
        return (
            <div className="quiz-creator-choice-collection">
                {rows}
            </div>
        );
    },

    addAnswer: function() {
        var answerNew = {
            answer: ""
        };
        var answers = _.clone(this.props.store.answers);
        answers.push(answerNew);
        this.props.store.setState({
            answers: answers
        });
    }
});

var SingleChoiceInputView = React.createClass({

    componentDidMount: function() {
        if(this.props.shouldFocus) {
            this.focus();
        }
    },

    render: function() {
        var domId = "input-" + utils.getUniqueId();
        //console.log("Choice State", this.state);
        var choice = this.props.store.choices[this.props.index];

        return (
            <div className="row">
                <div className="col-md-1">
                    <form>
                        <input type="checkbox" 
                               className="filled-in" 
                               id={domId} onChange={this.updateIsCorrect} 
                               checked={choice.isCorrect}
                               ref="input" />

                        <label htmlFor={domId}></label>
                    </form>
                </div>
                <div className="col-md-10">
                     <textarea  className="quiz-creator-choice-input" 
                                ref="textarea" placeholder="New Choice"  
                                onKeyUp={this.updateChoiceText} 
                                onChange={this.updateChoiceText} 
                                value={choice.choiceInput} 
                                onKeyDown={this.checkIfCtrlEnterPressedAndAddChoice} />   
                </div>
                <div className="col-md-1">
                    <span className="quiz-creator-remove-choice" onClick={this.removeChoice}>X</span>
                </div>
            </div>
        );
    },

    focus: function() {
        console.log("focusing"); 
        var el = this.refs.textarea.getDOMNode();
        var length = el.value.length;
        el.focus();
        el.setSelectionRange(length, length);
        
        return this;
    },

    updateChoiceText: function(evt) {

        var choiceInput = evt.target.value;
        var choiceDisplay = md.mdAndMathToHtml(choiceInput);
        
        var choicesNew = _.clone(this.props.store.choices);
        choicesNew[this.props.index].choiceInput = choiceInput;
        choicesNew[this.props.index].choiceDisplay = choiceDisplay;

        if(choicesNew[choicesNew.length - 1].choiceInput !== "") {
            choicesNew.push({
                choiceInput: "",
                choiceDisplay: "",
                isCorrect: false
            });
        }
        
        this.props.store.setState({
            choices: choicesNew
        });

    },

    checkIfCtrlEnterPressedAndAddChoice: function(evt) {
        if(evt.ctrlKey && evt.keyCode === 13) {
            console.log("Awesome");
            this.props.parent.addChoice();
        }
    },

    updateIsCorrect: function(evt) {
        var isCorrect = !this.props.store.choices[this.props.index].isCorrect;
        
        var choicesNew = _.clone(this.props.store.choices);
        choicesNew[this.props.index].isCorrect = isCorrect;

        this.props.store.setState({
            choices: choicesNew
        });
    },

    removeChoice: function() {
        var choicesNew = [];
        var length = this.props.store.choices.length;
        for(var i = 0; i < length; i++) {
            if(i !== this.props.index) {
                choicesNew.push(this.props.store.choices[i])
            }
        }
        this.props.store.setState({
            choices: choicesNew
        })
    }
});

var ChoiceCollectionInputView = React.createClass({

    render: function() {

        var choices = this.props.store.choices;
        var length = choices.length;

        if(choices.length === 0) {
            return (
                <div>
                    <button className="btn waves-effect waves-light quiz-creator-add-choice" onClick={this.addChoice}>
                        Add Choice
                    </button>
                </div>
            );
        };

        var rows = [];
        var latestElement = null;
        var shouldFocus = false;
        for(var i = 0; i < length; i++) {
            var key = i;
            latestElement = <SingleChoiceInputView 
                                index={i}
                                key={key} 
                                store={this.props.store} 
                                shouldFocus={shouldFocus} 
                                parent={this} />

            rows.push(latestElement);
        }
        
        return (
            <div className="quiz-creator-choice-collection">
                {rows}
            </div>
        );
    },

    addChoice: function() {
        var choiceNew = {
            isCorrect: false,
            choiceInput: "",
            choiceDisplay: ""
        }
        var choices = _.clone(this.props.store.choices);
        choices.push(choiceNew);
        this.props.store.setState({
            choices: choices
        });
    },

    checkIfCtrlEnterPressedAndAddChoice: function(evt) {
        var x = 1;
    },

    updateChoices: function() {

    }
});


var QuizCreatorView = React.createClass({

    render: function() {

        var toggleMessage = this.getToggleMessage();

        var answerInputView;
        if(this.props.store.quizType === constants.SHORT_ANSWER) {
            answerInputView = <ShortAnswerListView store={this.props.store} />
        }
        else {
            answerInputView = <ChoiceCollectionInputView store={this.props.store} />
        }

        return (
            <div>
                <h4 className="quiz-creator-input-heading">Quiz</h4>
                <textarea className="quiz-creator-question-input" 
                          placeholder={constants.QUESTION_PLACEHOLDER} 
                          onChange={this.updateQuestionText} 
                          value = {this.props.store.questionInput} /> 

                <TagListBaseView store={this.props.store} />
                {answerInputView}


               

                <button className="quiz-creator-mcq-toggle-button btn" onClick={this.toggleQuizType}>{toggleMessage}</button>
                
            </div>
        );
    },

    updateQuestionText: function(evt) {
        var input = evt.target.value;
        var html = md.mdAndMathToHtml(input);

        //console.log(html);
        console.log("updating questionText");
        this.props.store.setState({
            questionInput: input,
            questionDisplay: html
        });

    },


    getToggleMessage: function() {
        var toggleMessage;
        if(this.props.store.quizType === constants.SHORT_ANSWER) {
            toggleMessage = "I need an MCQ";
        }
        else {
            toggleMessage = "I need a short-answer quiz";
        }
        return toggleMessage;
    },

    toggleQuizType: function() {
        var quizType;
        if(this.props.store.quizType === constants.SHORT_ANSWER) {
            quizType = constants.MCQ;
        }
        else if(this.props.store.quizType === constants.MCQ){
            quizType = constants.SHORT_ANSWER;
        }
        else {
            //assert(false);
            console.error("Invalid quizType"); //todo -> throw an exception. Catch in monitoring. 
        }

        this.props.store.setState({
            quizType: quizType,
            answers: [{answer: ""}],
            choices: [{choiceInput: "", choiceDisplay: "", isCorrect: false}]
        });

    }
});


var QuizBox = React.createClass({

    getInitialState: function() {
        return this.props.store.getState()
    },

    componentWillMount: function() {
        this.props.store.on("change", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("change", this.updateState);
    },

    updateState: function(state) {
        this.setState(state)
    },

    render: function() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-6 quiz-page-split-column quiz-creator-container">
                        <QuizCreatorView store={this.props.store}/>
                    </div>
                    <div className="col-md-6 quiz-page-split-column quiz-student-container">
                        <h4 className="quiz-creator-preview-heading">Preview</h4>
                        <QuizPreview store={this.props.store} submitStore={this.props.submitStore} />
                    </div>
                </div>
            </div>
        );
    }
});


var QuizStore = function(options) {
    this._model = new models.QuizModel(options);
    this._options = options;

    if(options.quizId === null) {
        var attrs = this._model.toJSON();
        this._setAttrs(attrs);
        //this._dispatcher = options.dispatcher;
        this._model.once("sync", this.setRoute, this);
    }
};

QuizStore.prototype = {

    setState: function(state) {
        this._setAttrs(state);
        this._model.set(state);

        this.trigger("change", this._model.toJSON());
        console.log("Setting state");
        this._model.save();
    },

    getState: function() {
        var attrs = this._model.toJSON();
        this.addExtraAnswerAndChoice(attrs);
        return attrs;
    },

    _setAttrs: function(attrs) {
        _.each(_.keys(attrs), function(key) {
            this[key] = attrs[key];
        }, this);
        this.addExtraAnswerAndChoice({
            choices: this.choices,
            answers: this.answers
        });
    },

    addExtraAnswerAndChoice: function(attrs) {
        if(!attrs.choices.length || (attrs.choices[attrs.choices.length-1].choiceInput !== "")) {
            attrs.choices.push({
                choiceInput: "",
                choiceDisplay: "",
                isCorrect: false
            });
        }
        if(!attrs.answers.length || (attrs.answers[attrs.answers.length-1].answer !== "")) {
            attrs.answers.push({
                answer: ""
            });
        }
    },

    setRoute: function() {
        return;
        var quizId = this._model.attributes.id;
        var fragment = Backbone.history.getFragment();
        var fragmentNew = "{0}/{1}".format(fragment, quizId);
        Backbone.history.navigate(fragmentNew, {trigger: false});
    },

    isReady: function() {
        return this._options.quizId === null;
    },

    fetch: function() {
        this._model.once("sync", this.onFetched, this);
        return this._model.fetch();
    },

    onFetched: function() {
        this._setAttrs(this._model.toJSON());
    }
};

_.extend(QuizStore.prototype, Backbone.Events);

QuizStore.prototype.constructor = QuizStore;

var QuizSubmitStore = function(options) {
    this._quizStore = options.quizStore;
    this.guesses = [];
};

QuizSubmitStore.prototype = {
        
};

QuizSubmitStore.prototype.constructor = QuizSubmitStore;

var QuizCreatorModalComponent = React.createClass({

    componentWillMount: function() {
        
        this.store = new QuizStore({
            quizId: null
        });

        this.submitStore = new QuizSubmitStore({
            quizStore: this.store
        });
    },

    componentDidMount: function() {

        this.$modal = $("#quiz-creator-modal");
        //we'll manage dismissing manually since materialize leaks events
        this.$modal.openModal({
            dismissible: false 
        });
        
        var self = this;
        $(".lean-overlay").click(function() {
            self.props.parent.removeQuizCreator();
            $(this).off();
            $(this).remove();
        });

        var handleEspaceKeyPress = function(evt) {
            console.info("keyup leanModal", utils.getUniqueId());
            if(evt.keyCode === 27) {
                self.props.parent.removeQuizCreator();
                $(".lean-overlay").remove();
                $(document).off("keyup.leanModal");
            }

        };
        $(document).on('keyup.leanModal', handleEspaceKeyPress);

    },

    render: function() {

        return (
            <div className="modal" id="quiz-creator-modal">
                <div className="modal-content">
                    <QuizBox store={this.store} submitStore={this.submitStore} />
                </div>
            </div>
        );
    }
});

var render = function(element, options) {

    var store = new QuizStore(options);
    window.store = store;

    var submitStore = new QuizSubmitStore({
        quizStore: store
    });

    var renderQuizBox = function() {
        ReactDOM.render(
            <QuizBox store={store} submitStore={submitStore} />, 
            element
        );
    }

    if(store.isReady()) {
        renderQuizBox();
    }
    else {
        store.fetch().then(renderQuizBox)
    }

};

var unmount = function(element) {
    ReactDOM.unmountComponentAtNode(element);
}


module.exports = {
    render: render,
    unmount: unmount,
    QuizCreatorModalComponent: QuizCreatorModalComponent
}


