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
    this.concepts = [];
};

Store.prototype = {

    getName: function() {
        return "";
    },

    getConcepts: function() {
        return this.concepts;
    },

    addConcept: function(concept) {
        this.concepts.push(concept);
        this.trigger("add:concept", concept, this);
    }
};

_.extend(Store.prototype, Backbone.Events);
Store.prototype.constructor = Store;

/********************************************************************************
*   React Components
*
*
*********************************************************************************/

var TextInputMixin = {

    getInitialState: function() {
        return {
            name: this.props.store.getName()
        }
    },

    //todo -> rename concept-creator-section to creator-section
    render: function() {
        return (
            <div className="row concept-creator-section creator-text-input" id={this.ID || ""}>
                <h4> {this.HEADING} </h4>
                <input  type="text" 
                        placeholder="What's in a name?" 
                        value={this.state.name} 
                        onKeyUp={this.updateName} 
                        onChange={this.updateName} /> 
            </div>
        );
    },

    updateName: function(evt) {
        var name = evt.target.value;
        this.setState({
            name: name
        });
        this.saveState(name, evt);
    }

};

var CourseNameComponent = React.createClass({

    mixins: [TextInputMixin],

    ID: "creator-course-name",

    HEADING: "Course Name",

    saveState: function(name) {

    }

});

/********************************************************************************
*   LEFT COLUMN - CONCEPT LIST
*********************************************************************************/

var ConceptNameComponent = React.createClass({

    mixins: [TextInputMixin],

    HEADING: "Add Concept",

    ID: "creator-concept-name",

    saveState: function(name, evt) {
        console.log("saveState", evt.type);
        if(evt.type === "change") {
            return;
        }
        if(evt.keyCode === 13) {
            this.props.store.addConcept({
                name: name
            });
            this.setState({
                name: ""
            });
        }
    }

});

var ConceptListComponent = React.createClass({

    getInitialState: function() {
        return {
            concepts: this.props.store.getConcepts()
        }
    },

    componentDidMount: function() {
        this.props.store.on("add:concept", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("add:concept", this.updateState);
    },

    updateState: function() {
        this.setState({
            concepts: this.props.store.getConcepts()
        });
    },

    render: function() {

        var concepts = this.state.concepts;
        var length = concepts.length;

        var components = [];
        for(var i = 0; i < length; i++) {
            var concept = concepts[i];
            var item = <div className="collection-item" key={i}><h6>{concept.name}</h6></div>
            components.push(item);
        }

        return (
            <div className="collection">
                {components}
            </div>
        );
    },
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
        this.conceptNameContainer = $("<div>");
        this.listContainer = $("<div>");
        left.append(this.conceptNameContainer).append(this.listContainer);

        var middle = $("<div>").addClass("col-md-3");
        var right = $("<div>").addClass("col-md-6");

        this.dependencyContainer = middle;
        this.graphContainer = right;

        conceptContainer.append(left)
                        .append(middle)
                        .append(right);

        this.$el.append(this.courseNameContainer)
                .append(conceptContainer);

        return this; 
    },

    renderChildren: function() {
        this.addCourseName().addConceptName().addConceptList().addGraphView();
        return this;
    },

    addCourseName: function() {
        ReactDOM.render(<CourseNameComponent store={this.options.store} />, this.courseNameContainer[0]); 
        return this;
    },

    addConceptName: function() {
        ReactDOM.render(<ConceptNameComponent store={this.options.store} />, this.conceptNameContainer[0]); 
        return this;
    },

    addConceptList: function() {
        ReactDOM.render(<ConceptListComponent store={this.options.store} />, this.listContainer[0]);
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
    pageView.renderChildren();

}

var unmount = function() {

};

module.exports = {
    render: render,
    unmount: unmount
}

window.connected = connected;
