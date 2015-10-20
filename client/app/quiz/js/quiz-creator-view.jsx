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
        return(
            <input type="text" placeholder="Expected Answer" onChange={this.updateAnswer} value={this.props.store.answer} />
        );
    },

    updateAnswer: function(evt) {
        var answer = evt.target.value;
        this.props.store.setState({
            answer: answer
        });
        console.log("Current State", this.state)
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

        console.log("View currentModelCid: ", choices.currentModelCid);

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
            answerInputView = <ShortAnswerInputView store={this.props.store} />
        }
        else {
            answerInputView = <ChoiceCollectionInputView store={this.props.store} />
        }

        return (
            <div>
                <h4 className="quiz-creator-input-heading">Quiz</h4>
                <textarea className="quiz-creator-question-input" 
                          placeholder={constants.QUESTION_PLACEHOLDER} 
                          onKeyUp={this.updateQuestionText} 
                          onChange={this.updateQuestionText} 
                          value = {this.props.store.questionInput} /> 

                
                {answerInputView}

                <TagListBaseView store={this.props.store} />
               

                <button className="quiz-creator-mcq-toggle-button btn" onClick={this.toggleQuizType}>{toggleMessage}</button>
                
            </div>
        );
    },

    updateQuestionText: function(evt) {
        var input = evt.target.value;
        var html = md.mdAndMathToHtml(input);

        //console.log(html);
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
        if(this.props.store.quizType === constants.SHORT_ANSWER) {
            this.props.store.setState({
                quizType: constants.MCQ,
                answer: null,
                choices: []
            });

        }
        
        else {
            this.props.store.setState({
                quizType: constants.SHORT_ANSWER,
                answer: "",
                choices: []
            });
        }
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
        this._model.once("firstVersionSaved", this.setRoute, this);
    }
};

QuizStore.prototype = {

    setState: function(state) {
        this._setAttrs(state);
        this._model.set(state);

        this.trigger("change", this._model.toJSON());
        this._model.save();
    },

    getState: function() {
        return this._model.toJSON();
    },

    _setAttrs: function(attrs) {
        _.each(_.keys(attrs), function(key) {
            this[key] = attrs[key];
        }, this);
    },

    setRoute: function() {
        var quizId = this._model.attributes.quizId;
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

//var dispatcher = _.exte

var render = function(element, options) {

    var store = new QuizStore(options);

    var renderQuizBox = function() {
        ReactDOM.render(
            <QuizBox store={store} />, 
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
    unmount: unmount
}


