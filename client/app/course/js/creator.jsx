var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var connected = require("./../../conceptviz/js/connected");

/********************************************************************************
*   Store
*
*
*********************************************************************************/

var app = {

};

var Store = function(options) {
    this.options = options;
};

Store.prototype = {

    getName: function() {
        return "";
    }
};

Store.prototype.constructor = Store;

/********************************************************************************
*   React Components
*
*
*********************************************************************************/

var CourseNameComponent = React.createClass({

    getInitialState: function() {
        return {
            name: this.props.store.getName()
        }
    },

    //todo -> rename concept-creator-section to creator-section
    render: function() {
        return (
            <div className="row concept-creator-section">
                <h4> Course Name </h4>
                <input  type="text" 
                        placeholder="What's in a name?" 
                        value={this.state.name} 
                        onKeyup={this.updateName} 
                        onChange={this.updateName} /> 
            </div>
        );
    },

    updateName: function(evt) {
        var name = evt.target.value;
        this.setState({
            name: name
        });
    }
});


/********************************************************************************
*   Backbone Page View
*
*
*********************************************************************************/

var PageView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options;
        this.store = options.store;
    },

    render: function() {
        this.courseNameContainer = $("<div>");

        var conceptContainer = $("<div>").addClass("row");
        var left = $("<div>").addClass("col-md-3");
        var middle = $("<div>").addClass("col-md-3");
        var right = $("<div>").addClass("col-md-6");
        this.listContainer = left;
        this.dependencyContainer = middle;
        this.graphContainer = right;
        conceptContainer.append(left).append(middle).append(right);

        this.$el.append(this.courseNameContainer).append(conceptContainer);

        return this; 
    },

    addCourseName: function() {
        ReactDOM.render(<PageComponent store={this.options.store} />, this.courseNameContainer[0]); 
        return this;
    },

    addGraphView: function() {
        this.graphView = connected.render({
            width: this.graphContainer.width()
        });
        this.graphContainer.append(this.graphView.$el);
        this.graphView.render();
        return this;
    }
});

/********************************************************************************
*   PUBLIC `render` and `unmount` APIs
*
*
*********************************************************************************/

var render = function(options, element) {
    app.store = new Store(options);

    var pageView = new PageView({
        store: app.store,
        parent: element
    }).render();
    $(element).append(pageView.$el);
    pageView.addCourseName().addGraphView();

}

var unmount = function() {

};

module.exports = {
    render: render,
    unmount: unmount
}

window.connected = connected;
