var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var $ = require("lib").$;
var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");
var mdAndMathToHtml = require("md").mdAndMathToHtml;

var MarkdownDisplayComponent = require("markdown-and-preview.jsx").MarkdownDisplayComponent;
var ListMixin = require("list-mixin.jsx").ListMixin;
var CodeView = require("code-view").CodeView;
var LoadingCircle = require("loading-circle.jsx").LoadingCircle;

var CodeQuizModel = require("./models").CodeQuizModel;
var CodeQuizAttemptModel = require("./models").CodeQuizAttemptModel;

var Constants = require("app-constants");

var Store = function(options) {
    this.options = options;
    this._codequiz = new CodeQuizModel({
        id: options.id
    });
    this._attempt = new CodeQuizAttemptModel({
        codequizId: options.id
    });
    this._evaluationState = "NOT_EVALUATED";
};

Store.prototype = {

    getProblemStatement: function() {
        return this._codequiz.attributes.problemStatement;
    },

    getBootstrapCode: function() {
        return this._codequiz.attributes.bootstrapCode;
    },

    isAnswered: function() {
        return this._attempt.attributes.result === true;
    },

    cleanup: function() {
        this.off();
        this._codequiz.off();
        this._attempt.off();
    },

    fetch: function() {
        return this._codequiz.fetch();
    },

    setCode: function(code) {
        this._attempt.attributes.code = code;
        if(this._evaluationState != "NOT_EVALUATED") {
            this._evaluationState = "NOT_EVALUATED";
            this.trigger("change:evaluationState", this._evaluationState);
        }
    },

    submit: function() {
        this._evaluationState = "EVALUATING";

        var self = this;
        return this._attempt.save().then(function() {
            self._evaluationState = "EVALUATED";
            if(self._attempt.attributes.result === true) {
                self.trigger("answered");
            }
            else {
                //hack so that Backbone a POST request in the next attempt
                self._attempt.attributes.id = null; 
            }
            
        });
    },

    toJSON: function() {
        var codequizAttrs = this._codequiz.toJSON();
        var attemptAttrs = this._attempt.toJSON();
        var attrs = _.extend(attemptAttrs, codequizAttrs);
        attrs.evaluationState = this._evaluationState;
        return attrs;
    }
};
_.extend(Store.prototype, Backbone.Events);
Store.prototype.constructor = Store;

var ResultDetailsComponent = React.createClass({

    //todo
    render: function() {
        return (
            <div> 
                
            </div>
        );
    }
});

var CodeSubmitComponent = React.createClass({

    getInitialState: function() {
        var attrs = this.props.store.toJSON();
        if(this.props.isAnswered === true) {
            attrs.evaluationState = "EVALUATED";
            attrs.result = true;
        }
        return attrs;
    },

    componentWillMount: function() {
        this.props.store.on("change:evaluationState", this.updateEvaluationState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("change:evaluationState", this.updateEvaluationState);
    }, 

    updateEvaluationState: function(evaluationState) {
        this.setState({
            evaluationState: evaluationState
        });
    },

    render: function() {

        var enabled = this.state.evaluationState === "NOT_EVALUATED";
        var result = "";
        var resultDetails = "";
        if(this.state.evaluationState === "EVALUATED") {

            result = this.state.result === true ? Constants.QUIZ_FEEDBACK.CORRECT : Constants.QUIZ_FEEDBACK.WRONG;
            resultDetails = <ResultDetailsComponent {...this.state} />
        }

        var loading = "";
        if(this.state.evaluationState === "EVALUATING") {
            loading = <LoadingCircle />
        }
        return (
            <div className="code-quiz-submit-container">
                <div className="row">
                    <div className="col-xs-5 col-md-3">
                        <button className="btn btn-large waves-effect" 
                                onClick={this.submit} 
                                disabled={!enabled}>
                                Submit
                        </button>
                    </div>
                    <div className="col-xs-7 col-md-9 quiz-feedback">
                        {loading}
                        {result}
                    </div>
                </div>
                {resultDetails}
            </div>
        );
    },

    submit: function() {
        this.setState({
            evaluationState: "EVALUATING"
        });

        var self = this;
        this.props.store.submit().then(function() {
            self.setState(self.getInitialState());
        });
    }
});

var PageComponent = React.createClass({

    getInitialState: function() {
        return {
            isAnswered: this.props.isAnswered || false
        };
    },

    componentWillMount: function() {
        this._codeContainerId = "code-container-{0}".format(utils.getUniqueId());
    },

    componentDidMount: function() {
        var codeView = new CodeView({
            code: this.props.store.getBootstrapCode(),
            listenToInputChange: true
        });
        $("#"+this._codeContainerId).append(codeView.$el);
        codeView.render();
        this.codeView = codeView;

        this.codeView.on("change", this.updateCode, this);
        this.props.store.on("answered", this.setIsAnswered, this);
    },

    componentWillUnmount: function() {
        this.codeView.off("change", this.updateCode);
        this.props.store.off("answered");
        this.codeView.remove();
    },

    setIsAnswered: function() {
        this.setState({
            isAnswered: true
        })
    },

    getCode: function() {
        return this.codeView.val()
    },

    updateCode: function(code) {
        this.props.store.setCode(code);
    },

    render: function() {
        var problemStatementDisplay = mdAndMathToHtml(this.props.store.getProblemStatement());
        var answeredComponent = "";
        // if(!this.state.isAnswered) {
        //     answeredComponent = ""; 
        // }
        // else {
        //     answeredComponent = "Answered"; 
        // }
        return (
            <div className="student-quiz-container">
                <div className="student-quiz-number">
                    <p>{this.props.index || 0 + 1}.</p>
                </div>
                <div className="student-quiz-body">
                    <MarkdownDisplayComponent   display={problemStatementDisplay} 
                                                className="quiz-question-preview md" />

                    <div id={this._codeContainerId}></div>

                    <CodeSubmitComponent    store={this.props.store} 
                                            parent={this} 
                                            isAnswered={this.props.isAnswered} />
                </div>
                <div className="clearfix"> </div>                                        
                <hr />
            </div>
        );
    }
});

var ConceptSectionItemComponent = React.createClass({

    getInitialState: function() {
        return {
            isDataFetched: false,
            store: null,
            isAnswered: this.props.isAnswered
        }
    },

    componentWillMount: function() {
        this.store = new Store({
            id: this.props.id
        });

        var self = this;
        this.store.fetch().then(function() {
            self.setState({
                store: self.store,
                isDataFetched: true
            });
        });
    },

    componentWillUnmount: function() {
        this.store.cleanup();
    },

    render: function() {
        var content;
        var isAnswered;
        if(!this.state.isDataFetched) {
            content = <LoadingCircle />
        }
        else {
            isAnswered = this.props.isAnswered || false;
            content = <PageComponent    store={this.store} 
                                        isAnswered={isAnswered} 
                                        index={this.props.index} />
        }
        return (
            <div>
                {content}
            </div>
        );
    }
});

var ConceptSectionComponent = React.createClass({

    mixins: [ListMixin],

    _buildProps: function(item, index) {
        return {
            id: item.id,
            isAnswered: this.props.codeQuizAttemptStore.isAnswered(item.id),
            index: index
        };
    },

    render: function() {

        var list = this.createList({
            ComponentClass: ConceptSectionItemComponent,
            collection: this.props.section.data.quizzes,
            buildProps: this._buildProps
        });

        return (
            <div className="quiz-student-section card"> 
                {list} 
            </div>
        );
    }
});

var app = {

};

var render = function(options, element) {
    var store = new Store(options);

    store.fetch().then(function() {
        ReactDOM.render(<PageComponent store={store} />, element);
    });
    app.store = store;
    app.element = element;
};

var unmount = function() {
    ReactDOM.unmountComponentAtNode(app.element);
};

module.exports = {
    render: render,
    unmount: unmount,
    StudentCodeQuizSectionComponent: ConceptSectionComponent
};