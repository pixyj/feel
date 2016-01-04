var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;


var $ = require("lib").$; //used for modal stuff
var _ = require("lib")._;

var utils = require("utils");

var models = require("./models");
var QuizBankCollection = models.QuizBankCollection;

var app = {
    collection: new QuizBankCollection()
};


var QuizSnippetComponent = React.createClass({

    render: function() {
        var quiz = this.props.quiz;
        return (
            <div className="quiz-snippet collection-item"> 
                <div    className="md"
                        dangerouslySetInnerHTML={{__html: quiz.questionDisplay}} 
                        onClick={this.selectQuiz} />
            </div>
        );
    }

});

var QuizSelectComponent = React.createClass({

    render: function() {
        var createdAtDisplay = utils.prettyDate(utils.getUTCDate(new Date(this.props.createdAt)));
        return (
            <div className="collection-item quiz-filter-question"
                 onClick={this.selectQuiz}> 

                    <div    className="md"
                            dangerouslySetInnerHTML={{__html: this.props.questionDisplay}} />
                    <p className="created-at">Created {createdAtDisplay} </p>

            </div>
        );
    },

    selectQuiz: function() {
        console.log("Selected quiz");
        this.props.parent.selectQuiz(this.props.quiz);
    }
});

var QuizFilterComponent = React.createClass({

    getInitialState: function() {

        return {
            quizzes: [],
            filterInput: ""
        };

    },

    componentDidMount: function() {
        this.init();

        //we'll manage dismissing manually since materialize leaks events
        this.$modal = $("#quiz-filter-modal");
        this.$modal.openModal({
                        top: "5%",
                        dismissible: false
                    });

        
        var self = this;
        $(".lean-overlay").click(function() {
            self.props.parent.removeQuizFilter();
            $(this).off();
            $(this).remove();
            $(document.body).css({
                "overflow": "visible"
            });
        });

        var handleEspaceKeyPress = function(evt) {
            console.info("keyup leanModal", utils.getUniqueId());
            if(evt.keyCode === 27) {
                self.props.parent.removeQuizFilter();
                $(".lean-overlay").remove();
                $(document).off("keyup.leanModal");
                $(document.body).css({
                    "overflow": "visible"
                });
            }

        };
        $(document).on('keyup.leanModal', handleEspaceKeyPress);

    },

    init: function() {
        app.collection.once("sync", this._cacheQuizInputsAndRender);
        app.collection.fetch();
    },

    _cacheQuizInputsAndRender: function() {
        app.collection.cacheQuizInputs();
        this.setState({
            quizzes: app.collection.getCachedQuizzes(),
            filterInput: ""
        });
    },

    render: function() {

        var rows = [];
        var length = this.state.quizzes.length;
        for(var i = 0; i < length; i++) {
            var attrs = this.state.quizzes[i];
            var view = <QuizSelectComponent 
                            questionDisplay={attrs.questionDisplay} 
                            key={i}
                            createdAt={attrs.createdAt} 
                            quiz={attrs}
                            parent={this} />
            rows.push(view); 
        };

        var inputId = "input-" + utils.getUniqueId();

        return (
            <div className="modal" id="quiz-filter-modal">
                <div className="modal-content">
                    <div className="card">
                        
                        <div className="input-field quiz-filter-input-field">
                            <input  type="text" 
                                    id={inputId}
                                    value={this.state.filterInput}
                                    onKeyUp={this.filterQuizzes} 
                                    onChange={this.filterQuizzes} />
                            <label htmlFor={inputId}>Filter Questions</label>
                        </div>
                        <div className="collection quiz-filter-items">
                            {rows}
                        </div>
                    </div>
                </div>
            </div>
        );  
    },

    selectQuiz: function(quiz) {
        this.$modal.closeModal();
        this.props.parent.selectQuiz(quiz);
    },

    filterQuizzes: function(evt) {
        var value = evt.target.value;
        if(!value.length) {
            this.setState({
                quizzes: app.collection.getCachedQuizzes(),
                filterInput: ""
            });
        }
        else {

            var notValidChars = /[^a-zA-Z0-9 ]/g; //Internationalization out of the window
            var sanitizedInput = value.replace(notValidChars, "").toLowerCase();
            var quizzes = _.filter(app.collection.getCachedQuizzes(), function(q) {
                return q.questionInputLowerCase.indexOf(sanitizedInput) !== -1;
            });
            this.setState({
                quizzes: quizzes,
                filterInput: value
            });    
        }
    }


});

module.exports = {
    QuizFilterComponent: QuizFilterComponent,
    QuizSnippetComponent: QuizSnippetComponent
};


