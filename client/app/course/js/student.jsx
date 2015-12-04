var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");
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


var PageComponent = React.createClass({

    componentDidMount: function() {
        this.renderGraph();
    },

    render: function() {

        return (
            <div>
                <h3> Welcome to {this.props.store.getCourseName()}  </h3>
                <div ref="graphContainer"> </div>
            </div>
        );
    },

    renderGraph: function() {
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