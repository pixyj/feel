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
var CodeQuizModel = require("./models").CodeQuizModel;
var CodeQuizAttemptModel = require("./models").CodeQuizAttemptModel;

var Store = function(options) {
    this.options = options;
    this._model = new CodeQuizModel({
        id: options.id
    });
    this._attempt = new CodeQuizAttemptModel({
        codequizId: options.id
    })
};

Store.prototype = {

    getProblemStatement: function() {
        return this._model.attributes.problemStatement;
    },

    getBootstrapCode: function() {
        return this._model.attributes.bootstrapCode;
    },

    cleanup: function() {
        this.off();
        this._model.off();
    },

    fetch: function() {
        return this._model.fetch();
    },

    setCode: function(code) {
        this._attempt.attributes.code = code;
    },

    submit: function() {
        return this._attempt.save()
    },

    toJSON: function() {
        return this._model.toJSON();
    }
};
_.extend(Store.prototype, Backbone.Events);
Store.prototype.constructor = Store;

var CodeSubmitComponent = React.createClass({

    getInitialState: function() {
        return {
            evaluationState: "NOT_EVALUATED"
        };
    },

    render: function() {

        var disabled = !this.state.evaluationState === "NOT_EVALUATED";
        return (
            <div id="code-quiz-submit-container">
                <button className="btn btn-large waves-effect" 
                        onClick={this.submit} 
                        disabled={disabled}>
                        Submit
                </button>
            </div>
        );
    },

    submit: function() {
        var code = this.props.parent.getCode();
        this.props.store.setCode(code);
        this.setState({
            evaluationState: "EVALUATING"
        });

        var self = this;
        this.props.store.submit().then(function() {
            self.setState({
                evaluationState: "EVALUATED"
            });
        });
    }
});

var PageComponent = React.createClass({

    render: function() {
        var problemStatementDisplay = mdAndMathToHtml(this.props.store.getProblemStatement());
        return (
            <div>
                <MarkdownDisplayComponent display={problemStatementDisplay} />
                <div id="code-container"></div>
                <CodeSubmitComponent store={this.props.store} parent={this} />
            </div>
        );
    },

    componentDidMount: function() {
        var codeView = new CodeView({
            code: this.props.store.getBootstrapCode(),
            listenToInputChange: false
        });
        $("#code-container").append(codeView.$el);
        codeView.render();
        this.codeView = codeView;
    },

    componentWillUnmount: function() {
        this.codeView.remove();
    },

    getCode: function() {
        return this.codeView.val()
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
    unmount: unmount
};