var React = require("react");
var ReactDOM = require("react-dom");

var $ = require("jquery");
var _ = require("underscore");
var Backbone = require("backbone");

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
            self._attempt.attributes.id = null; //hack
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
        return this.props.store.toJSON()
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
            <div id="code-quiz-submit-container">
                <div className="row">
                    <div className="col-xs-3">
                        <button className="btn btn-large waves-effect" 
                                onClick={this.submit} 
                                disabled={!enabled}>
                                Submit
                        </button>
                    </div>
                    <div className="col-xs-9 quiz-feedback">
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
    },

    componentWillUnmount: function() {
        this.codeView.off("change", this.updateCode);
        this.codeView.remove();
    },

    getCode: function() {
        return this.codeView.val()
    },

    updateCode: function(code) {
        this.props.store.setCode(code);
    },

    render: function() {
        var problemStatementDisplay = mdAndMathToHtml(this.props.store.getProblemStatement());
        return (
            <div>
                <MarkdownDisplayComponent display={problemStatementDisplay} />
                <div id={this._codeContainerId}></div>
                <CodeSubmitComponent store={this.props.store} parent={this} />
            </div>
        );
    }
});

var ConceptSectionItemComponent = React.createClass({

    getInitialState: function() {
        return {
            isDataFetched: false,
            store: null
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
        if(!this.state.isDataFetched) {
            content = <LoadingCircle />
        }
        else {
            content = <PageComponent store={this.store} />
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

    _buildProps: function(item) {
        return {
            id: item.id
        };
    },

    render: function() {

        var list = this.createList({
            ComponentClass: ConceptSectionItemComponent,
            collection: this.props.section.data.quizzes,
            buildProps: this._buildProps
        });

        return (
            <div> {list} </div>
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