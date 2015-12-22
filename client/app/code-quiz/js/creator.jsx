var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");
var mdAndMathToHtml = require("md").mdAndMathToHtml;
var ProblemStatement = require("markdown-and-preview.jsx").MarkdownAndPreviewComponent;
var ListMixin = require("list-mixin.jsx").ListMixin;


var Store = function() {
    this._attrs =  {
            problemStatement: "",
            bootstrapCode: "",
            testCases: [
                {
                    input: "",
                    output: "",
                    timeLimit: 1000,
                    memoryLimit: 1000
                }
            ]
        };
};

Store.prototype = {

    getTestCaseAt: function(index) {
        return _.clone(this._attrs.testCases[index]);
    },

    updateTestCaseAt: function(attrs, index) {
        var testCase = this._attrs.testCases[index];
        _.each(attrs, function(value, key) {
            testCase[key] = value;
        });
    },

    addTestCase: function() {
        var testCase = {
            input: "",
            output: ""
        };
        this._attrs.testCases.push(testCase);
    },

    cleanup: function() {
        this.off();
    },

    toJSON: function() {
        return _.clone(this._attrs);
    }
};
_.extend(Store.prototype, Backbone.Events);
Store.prototype.constructor = Store;

var SingleTestCase = React.createClass({

    getInitialState: function() {
        return this.props.store.getTestCaseAt(this.props.index);
    },

    render: function() {

        return (
            <div className="row">
                <div className="col-md-6">
                    <h6 className="center">Input</h6>

                    <textarea   className="testcase-creator-io"
                                value={this.state.input}
                                onKeyUp={this.updateInput} 
                                onChange={this.updateInput} />
                </div>

                <div className="col-md-6">
                    <h6 className="center">Expected Output</h6>

                    <textarea   className="testcase-creator-io" 
                                value={this.state.output}
                                onKeyUp={this.updateOutput} 
                                onChange={this.updateOutput} />
                </div>
            </div>
        );
    },

    updateInput: function(evt) {
        this.updateState({
            input: evt.target.value
        });
    },

    updateOutput: function(evt) {
        this.updateState({
            output: evt.target.value
        });
    },

    updateState: function(attrs) {
        this.setState(attrs);
        this.props.store.updateTestCaseAt(attrs, this.props.index);
    }
});

var TestCaseList = React.createClass({

    mixins: [ListMixin],

    getInitialState: function() {
        return this.props.store.toJSON()
    },

    _buildProps: function(testCase, i) {
        return {
            index: i,
            store: this.props.store
        };
    },

    render: function() {

        var list = this.createList({
            ComponentClass: SingleTestCase,
            collection: this.props.testCases,
            buildProps: this._buildProps
        });
        return (
            <div>
                <h5 className="center">Test Cases </h5>
                {list}
                <button className="btn waves-effect" 
                        onClick={this.addTestCase}>
                        Add Test Case 
                </button>
            </div>
        );
    },

    addTestCase: function() {
        this.props.store.addTestCase();
        this.setState(this.getInitialState());
    }
});

var PageComponent = React.createClass({

    getInitialState: function() {
        return this.props.store.toJSON()
    },

    componentDidMount: function() {
        //this.props.store.on("change", this.updateState, this);
    },

    componentWillUnmount: function() {
        //this.props.store.off("change", this.updateState);
    },

    updateState: function() {
        return this.getInitialState();
    },

    render: function() {

        var problemStatementDisplay = mdAndMathToHtml(this.state.problemStatement);
        return (
            <div>
                <h4 className="center"> Code Quiz </h4>
                <ProblemStatement   input={this.state.problemStatement}
                                    dislay={problemStatementDisplay} />  

                <TestCaseList   testCases={this.state.testCases} 
                                store={this.props.store} />
            </div>
        );
    }
});


var app = {

};

var render = function(options, element) {

    var store = new Store(options);
    ReactDOM.render(<PageComponent store={store} />, element);
    app.element = element;
};

var unmount = function() {
    app.store.cleanup();
    ReactDOM.unmountComponentAtNode(app.element);
};

module.exports = {
    render: render,
    unmount: unmount
}