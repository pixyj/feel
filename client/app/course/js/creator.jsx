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
        return _.clone(this.concepts);
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
            <div className="row creator-text-input" id={this.ID || ""}>
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

var ConceptListMixin = {

    componentWillMount: function() {
        this.props.store.on("add:concept", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("add:concept", this.updateState);
        this.cleanup();
    },

    updateState: function() {
        this.setState({
            concepts: this.props.store.getConcepts()
        });
    },

    getListItems: function() {
        var concepts = this.state.concepts;
        var length = concepts.length;

        var components = [];
        var ComponentClass = this.getComponentClass();
        for(var i = 0; i < length; i++) {
            var concept = concepts[i];
            var item = <ComponentClass key={i} name={concept.name} />
            components.push(item);
        }
        return components;
    }
};

var ConceptListItemComponent = React.createClass({

    render: function() {
        return (
            <div className="collection-item" key={this.props.key} > 
                {this.props.name} 
            </div>
        );
    }
});

var ConceptListComponent = React.createClass({

    mixins: [ConceptListMixin],

    getInitialState: function() {
        return {
            concepts: this.props.store.getConcepts()
        }
    },

    getComponentClass: function() {
        return ConceptListItemComponent;
    },

    render: function() {

        var components = this.getListItems();

        return (
            <div className="collection">
                {components}
            </div>
        );
    }

});

/********************************************************************************
*   MIDDLE COLUMN - ADD CONCEPT DEPENDENCY
*********************************************************************************/

var ConceptSelectItemComponent = React.createClass({

    render: function() {
        return (
            <option key={this.props.key} value={this.props.key} > 
                {this.props.name} 
            </option>
        );
    }
});

var ConceptSelectMixin = {

    getInitialState: function() {
        return {
            concepts: this.props.store.getConcepts()
        }
    },

    getComponentClass: function() {
        return ConceptSelectItemComponent;
    },

    componentDidMount: function() {
        this.afterRender();
    },

    componentDidUpdate: function() {
        this.afterRender();
    },

    afterRender: function() {
        this.cleanup();
        $(this.refs.select).material_select();
    },

    cleanup: function() {
        $(this.refs.select).material_select('destroy');
    },

    render: function() {

        var components = this.getListItems();
        return (
            <div className="concept-select">
                <h5>{this.LABEL}</h5>
                <div className="input-field">
                    <select ref="select">
                        <option value="" disabled>Choose a Concept </option>
                        {components}
                    </select>
                </div>
            </div>
        );
    }
};

var ConceptSelectFromComponent = React.createClass({

    mixins: [ConceptListMixin, ConceptSelectMixin],

    LABEL: "From"

});

var ConceptSelectToComponent = React.createClass({

    mixins: [ConceptListMixin, ConceptSelectMixin],

    LABEL: "To"

});

var ConceptDependencyComponent = React.createClass({

    getInitialState: function() {

        return {
            concepts: this.props.store.getConcepts(),
            from: null,
            to: null    
        }

    },

    render: function() {

        return (
            <div>
                <h5>Add Dependency</h5>
                <ConceptSelectFromComponent store={this.props.store} />
                <ConceptSelectToComponent store={this.props.store} />
            </div>
        );
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
        this.conceptNameContainer = $("<div>");
        this.listContainer = $("<div>");
        left.append(this.conceptNameContainer).append(this.listContainer);

        var middle = $("<div>").addClass("col-md-3");
        this.dependencyContainer = middle;

        var right = $("<div>").addClass("col-md-6");

        this.graphContainer = right;

        conceptContainer.append(left)
                        .append(middle)
                        .append(right);

        this.$el.append(this.courseNameContainer)
                .append(conceptContainer);

        return this; 
    },

    renderChildren: function() {
        this.addCourseName()
            .addConceptName()
            .addConceptList()
            .addSelectConceptDependency()
            .addGraphView();

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

    addSelectConceptDependency: function() {
        ReactDOM.render(<ConceptDependencyComponent store={this.options.store} />, this.dependencyContainer[0]);
        
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
