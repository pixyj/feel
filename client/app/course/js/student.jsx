var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");
var RadioGroup = require("radio-group.jsx").RadioGroup;
var CreatorStore = require("./models").CreatorStore;


var connected = require("./../../conceptviz/js/connected");

/********************************************************************************
*   Store
*
*
*********************************************************************************/

var Store = function(options) {
    this.id = options.id;
    this.creatorStore = new CreatorStore({
        id: this.id,
        setRoute: false
    });

    this.initializeCreatorAPIs();
};

Store.prototype = {

    fetch: function() {

        var one = this.creatorStore.fetch();
        var promises = [one];

        var mergedPromise = $.when.apply($, promises);

        return mergedPromise;            
    },

    //provide a declarative way to define wrapper functions
    //This is why I love JavaScript
    creatorAPIs: {
        'getCourseName': 'getName',
        'getGraph': 'getGraph'
    },

    initializeCreatorAPIs: function() {

        var self = this;
        var creator = this.creatorStore;
        _.each(this.creatorAPIs, function(creatorMethod, myMethod) {
            this[myMethod] = function() {
                return creator[creatorMethod].apply(creator, arguments);
            };
        }, this);
    }

};

Store.prototype.constructor = Store;


/********************************************************************************
*   Components
*
*
*********************************************************************************/

var STUDENT_SKILL_ESTIMATION_LEVELS = [

    {
        value: 0,
        display: "I'm completely new"
    },
    {
        value: 1,
        display: "I consider myself a beginner"
    },
    {
        value: 2,
        display: "I've studied these topics, but I'm a bit rusty."
    },
    {
        value: 4,
        display: "I'm familiar with most/all of these topics."
    }
];

var StudentSkillEstimationComponent = React.createClass({

    render: function() {

        var rows = [];
        var levels =  STUDENT_SKILL_ESTIMATION_LEVELS;
        var radioGroup = <RadioGroup items={levels} />

        return (
            <div>
                <h4>Which one these describes you best?</h4>
                {radioGroup}
            </div>
        );
    }
});


var PageComponent = React.createClass({

    componentDidMount: function() {
        this.renderGraph();
    },

    render: function() {

        return (
            <div>
                <h3> Welcome to {this.props.store.getCourseName()}  </h3>
                <div className="row"> 
                    <div className="col-xs-5 col-md-6">
                        <StudentSkillEstimationComponent parent={this} />
                    </div>
                    <div    className="col-xs-7 col-md-6" 
                            ref="graphContainer" 
                            parent={this} >
                    </div>
                </div>
            </div>
        );
    },

    renderGraph: function() {
        return;
        var graphContainer = $(ReactDOM.findDOMNode(this.refs.graphContainer));
        this.graphView = connected.render({
            width: graphContainer.width()
        });
        graphContainer.append(this.graphView.$el);
        this.graphView.render(this.props.store.getGraph());
        return this;
    }
});

/********************************************************************************
*   PUBLIC `render` and `unmount` APIs
*
*
*********************************************************************************/

var app = {

};

var render = function(options, element) {
    console.log("hi", arguments);

    var store = new Store(options);
    store.fetch().then(function() {
        ReactDOM.render(<PageComponent store={store} />, element); 
    });

    app.store = store;
    app.element = element;

};

var unmount = function() {

};

module.exports = {
    render: render,
    unmount: unmount
}