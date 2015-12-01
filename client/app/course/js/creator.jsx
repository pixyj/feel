var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var connected = require("./../../conceptviz/js/connected");

var DAG = require("./../../conceptviz/js/DAG").DAG;

var StreamSaveModel = require("models").StreamSaveModel;

/********************************************************************************
*   Store
*
*
*********************************************************************************/

var app = {

};

var CourseModel = StreamSaveModel.extend({

    defaults: {
        name: "",
        isPublished: false
    },

    BASE_URL: "/api/v1/courses/",

    initialize: function() {
        this._isNew = this.isNew();
    },

    isNew: function() {
        return Backbone.Model.prototype.isNew.call(this);
    },

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.id);
    }
});

var ConceptModel = Backbone.Model.extend({

});

var ConceptCollection = Backbone.Collection.extend({

    initialize: function(options) {
        this.course = options.course;
    },

    model: ConceptModel,

    url: function() {
        return "{}/concepts/".format(this.course.url())
    },

});

var DependencyModel = Backbone.Model.extend({

});

var DependencyCollection = Backbone.Collection.extend({

    model: DependencyModel,

    initialize: function(options) {
        this.course = options.course;
    },

    url: function() {
        return "{}/dependencies/".format(this.course.url());
    }
});

var Store = function(options) {
    this.options = options;
    this.concepts = [];
    this.dag = new DAG({});

    this._course = new CourseModel(options);
    this._concepts = new ConceptCollection({course: this.courseModel});
    this._dependencies = new DependencyCollection({course: this.courseModel});
};

Store.prototype = {

    getName: function() {
        return this._course.get("name");
    },

    setName: function(name) {
        this._course.set("name", name);
        this._course.save();
    },

    getConcepts: function() {
        return _.clone(this.concepts);
    },

    addConcept: function(concept) {
        if(!concept.id) {
            concept.id = String(utils.getUniqueId());
        }
        this.concepts.push(concept);
        this.dag.addNode(concept);
        this.trigger("add:concept", concept, this);
    },

    addDependency: function(from, to) {

        var edge = {
            from: from,
            to: to
        };

        this.dag.addEdge(from, to);
        var nodesByLevel = this.dag.sort();
        
        var edges = this.dag.getEdges();
        var graph = {
            levels: nodesByLevel,
            edges: edges
        }
        console.log("graph", graph);
        this.trigger("add:dependency", graph, edge);
    },

    getGraph: function() {
        return {
            levels: this.dag.sort(),
            edges: this.dag.getEdges()
        }
    },

    fetch: function() {
        
        if(this._course.isNew()) {
            return $.Deferred().resolve().promise() 
        }

        var one = this._course.fetch();
        var two = this._concepts.fetch();
        var three = this._dependencies.fetch();

        var promises = [one, two, three];

        return $.when.apply($, promises);

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
        this.props.store.setName(name);
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
            var item = <ComponentClass key={i} name={concept.name} id={concept.id} />
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
            <option key={this.props.key} value={this.props.id} > 
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

        var self = this;
        var callback = function() {
            console.log("selected ", self, arguments);
            var value = $(self.refs.select).val(); 
            self.props.parent.onConceptSelected(self.LABEL.toLowerCase(), value);
        }
        $(this.refs.select).material_select(callback);
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

        //this is managed outside of React. 
        self.from = null;
        self.to = null;

        return {
            concepts: this.props.store.getConcepts() 
        }

    },

    render: function() {

        return (
            <div>
                <h5>Add Dependency</h5>
                <ConceptSelectFromComponent store={this.props.store} parent={this} />
                <ConceptSelectToComponent store={this.props.store} parent={this} />
            </div>
        );
    },

    onConceptSelected: function(label, value) {
        this[label] = value || null;
        if(label === "to" && this.from !== null) {
            this.props.store.addDependency(this.from, this.to);
        }
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

        this.listenTo(this.store, "add:dependency", this.refreshGraphView);
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
            .addConceptSelectDependency()
            .addGraphView();

        return this;
    },

    //todo -> unmount components
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

    addConceptSelectDependency: function() {
        ReactDOM.render(<ConceptDependencyComponent store={this.options.store} />, this.dependencyContainer[0]);
        return this;
    },

    addGraphView: function() {
        this.graphView = connected.render({
            width: this.graphContainer.width()
        });
        this.graphContainer.append(this.graphView.$el);
        this.graphView.render(this.store.getGraph());
        return this;
    },

    refreshGraphView: function(graph) {
        this.graphView.refresh(graph);
    }
});

/********************************************************************************
*   PUBLIC `render` and `unmount` APIs
*
*
*********************************************************************************/

var render = function(options, element) {

    app.store = new Store(options);

    app.store.fetch().then(function() {

        var pageView = new PageView({
            store: app.store,
            parent: element
        }).render();

        $(element).append(pageView.$el);
        pageView.renderChildren();

        app.pageView = pageView;
    });

}

var unmount = function() {

};

module.exports = {
    render: render,
    unmount: unmount
}

window.connected = connected;
