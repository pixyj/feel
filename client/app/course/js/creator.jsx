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

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.id);
    },

    studentURL: function() {
        utils.assert(this.attributes.slug, "Slug not found");
        return "#/{0}/".format(this.attributes.slug);
    },

    creatorURL: function() {
        var base = "/creator/course/";
        var url;
        if(this.attributes.isPublished) {
            url = "{0}{1}/".format(base, this.attributes.slug);
        }
        else {
            url = "{0}{1}/".format(base, this.attributes.id);
        }
        return url;
    }
});

var ConceptModel = Backbone.Model.extend({

    parse: function(attrs) {
        attrs.url = "/#creator/concept/{0}/".format(attrs.id);
        return attrs;
    }
});

var ConceptCollection = Backbone.Collection.extend({

    initialize: function(options) {
        this.course = options.course;
        this.dag = options.dag;
    },

    model: ConceptModel,

    url: function() {
        return "{0}concepts/".format(this.course.url())
    },

    parse: function(concepts) {
        _.each(concepts, function(c) {
            this.dag.addNode(c);
        }, this);

        return concepts;
    }
});

var DependencyModel = Backbone.Model.extend({

});

var DependencyCollection = Backbone.Collection.extend({

    model: DependencyModel,

    initialize: function(options) {
        this.course = options.course;
        this.dag = options.dag;
    },

    url: function() {
        return "{0}dependencies/".format(this.course.url());
    },

    //from is a keyword in Python, so I'm using start and end on the server
    //todo -> change client code to start and end as well. 
    parse: function(response) {

        var deps = [];
        _.each(response, function(d) {
            deps.push({
                from: d.start,
                to: d.end
            });
        });
        return deps;
    },

    initializeDAG: function() {
        _.each(this.toJSON(), function(dep) {
            this.dag.addEdge(dep.from, dep.to);
        }, this);
    }
});

var Store = function(options) {
    this.options = options;
    this.dag = new DAG({});


    this._course = new CourseModel(options);
    this._concepts = new ConceptCollection({course: this._course, dag: this.dag});
    this._dependencies = new DependencyCollection({course: this._course, dag: this.dag});

    if(this._course.isNew()) {
        this._course.once("sync", this.setRoute, this);
    }
    this.listenToEvents();
    window.course = this._course;
};

Store.prototype = {

    listenToEvents: function() {
        this._course.on("sync", this.onCourseSynced, this);
    },

    cleanup: function() {
        this._course.off("sync", this.onCourseSynced);
    },

    getName: function() {
        return this._course.get("name");
    },

    setName: function(name) {
        this._course.set("name", name);
        this._course.save();
    },

    isPublished: function() {
        return this._course.attributes.isPublished;
    },

    getStudentURL: function() {
        return this._course.studentURL();
    },

    togglePublish: function() {
        var isPublished = !this.isPublished();
        this._course.set({
            isPublished: isPublished
        });

        var self = this;
        this._isPublishedChanged = true;
        this._course.save();
    },

    onCourseSynced: function() {
        if(!this._isPublishedChanged) {
            return;
        }
        this.setRoute(true);
        this._isPublishedChanged = false;
        this.trigger("change:isPublished", this.isPublished(), this);
    },

    getConcepts: function() {
        return this._concepts.toJSON();
    },

    addConcept: function(concept) {

        var model = this._concepts.add(concept);
        var self = this;

        var onSaved = function() {
            self.trigger("add:concept", concept, self);
        }
        if(model.isNew()) {
            model.save().then(onSaved);
        }
        else {
            onSaved();
        }
    },

    addDependency: function(from, to) {

        var edge = {
            from: from,
            to: to
        };

        var nodesByLevel;
        try {
            this.dag.addEdge(from, to);
            nodesByLevel = this.dag.sort();    
        } catch (e) {
            this.dag.removeEdge(from, to);
            return false;
        }
        
        var model = this._dependencies.add(edge);
        var self = this;
        var onSaved = function() {
            var edges = self.dag.getEdges();
            var graph = {
                levels: nodesByLevel,
                edges: edges
            }
            self.trigger("add:dependency", graph, edge);
        };

        if(model.isNew()) {
            model.save().then(onSaved);
        }
        else {
            onSaved();
        }
        
        return true;
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

        var self = this;
        var fetchedPromise = $.when.apply($, promises);
        fetchedPromise.then(function() {
            self._dependencies.initializeDAG();
            self.setRoute(true);
        });

        return fetchedPromise;

    },

    setRoute: function(replace) {
        replace = replace || false;
        var url = this._course.creatorURL();
        Backbone.history.navigate(url, {trigger: false, replace: replace});
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

    componentWillMount: function() {
        this.props.store.on("change:isPublished", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("change:isPublished", this.updateState);
    },

    updateState: function() {
        this.setState(this.getInitialState);
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
                        onChange={this.updateName} 
                        disabled={this.state.isPublished} /> 
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

    getInitialState: function() {
        return {
            name: this.props.store.getName(),
            isPublished: this.props.store.isPublished()
        }
    },

    ID: "creator-course-name",

    HEADING: "Course Name",

    saveState: function(name) {
        this.props.store.setName(name);
    }

});

var CoursePublishComponent = React.createClass({

    getInitialState: function() {
        return {
            isPublished: this.props.store.isPublished(),
            disabled: false,
            publishedJustNow: false
        };
    },

    componentWillMount: function() {
        this.props.store.on("change:isPublished", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("change:isPublished", this.updateState);
    },

    updateState: function() {
        this.setState({
            isPublished: this.props.store.isPublished(),
            disabled: false,
            publishedJustNow: true
        });
    },

    render: function() {

        var className = "btn btn-large waves-effect ";
        if(this.state.isPublished) {
            className += "course-published ";
        }
        else {
            className += "course-not-published ";
        }

        var publishedJustNow = "";
        var justNowDisplay = {
            false: "Unpublished",
            true: "Published!"
        };
        if(this.state.publishedJustNow) {
            publishedJustNow = <h6 className="course-published-just-now">
                                    {justNowDisplay[this.state.isPublished]}
                                </h6>
            this.showAndHidePublishedJustNowMessage(); 
        }

        var display = {
            false: "Publish",
            true: "Unpublish",
        }

        var studentLink = "";
        if(this.state.isPublished) {
            var url = this.props.store.getStudentURL();
            studentLink = <a href={url} id="course-publish-share"> Share! </a>
        }

        return (
            <div id="course-publish-container">
                <div>
                    <button className={className} 
                            onClick={this.handleClick}  
                            disabled={this.state.disabled} >

                        {display[this.state.isPublished]} 
                    </button>
                    {studentLink}
                    <div>{publishedJustNow}</div>
                </div>
            </div>
        );
    },

    showAndHidePublishedJustNowMessage: function() {

        if(this._timer) {
            clearTimeout(this._timer);
        }

        var self = this;
        this._timer = setTimeout(function() {
                        self.hidePublishedJustNow();
                    }, 2000);
    },

    hidePublishedJustNow: function() {
        this.setState({
            publishedJustNow: false
        });
    },

    handleClick: function() {
        if(this.state.disabled) {
            return;
        }

        this.props.store.togglePublish();
        this.setState({
            disabled: true
        });
    }
});

/********************************************************************************
*   LEFT COLUMN - CONCEPT LIST
*********************************************************************************/

var ConceptNameComponent = React.createClass({

    mixins: [TextInputMixin],

    HEADING: "Add Concept",

    ID: "creator-concept-name",

    getInitialState: function() {
        return {
            name: "",
            isPublished: this.props.store.isPublished()
        }
    },

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
    },

    updateState: function() {
        this.setState({
            concepts: this.props.store.getConcepts()
        });
    },

    getListItems: function() {
        
        var concepts;
        if(!this.state) {
            concepts = this.props.concepts;
        }
        else {
            concepts = this.state.concepts;
        }
        var length = concepts.length;

        var components = [];
        var ComponentClass = this.getComponentClass();
        for(var i = 0; i < length; i++) {
            var concept = concepts[i];
            var item = <ComponentClass  key={i} 
                                        name={concept.name} 
                                        id={concept.id} 
                                        url={concept.url} />
            components.push(item);
        }
        return components;
    }
};

var ConceptListItemComponent = React.createClass({

    render: function() {
        return (
            <div className="collection-item" key={this.props.key} > 
                <a href={this.props.url}> {this.props.name} </a>
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

    getComponentClass: function() {
        return ConceptSelectItemComponent;
    },

    render: function() {

        var components = this.getListItems();
        return (
            <div className="concept-select">
                <div className="input-field">
                    <select ref="select" 
                            value={this.props.value || ""}
                            onChange={this.onChange} >

                        <option value=""> {this.LABEL.toUpperCase()} </option>
                        {components}

                    </select>
                </div>
            </div>
        );
    },

    onChange: function(evt) {
        this.props.parent.onConceptSelected(this.LABEL, evt.target.value);
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
            to: null,
            cycleDetected: false,
            justAdded: false
        }

    },

    //> null !== null
    //> false
    isEnabled: function() {
        var from = this.state.from;
        var to = this.state.to;
        return from !== null && to !== null && from !== to;
    },

    render: function() {

        var cycleComponent = "";
        if(this.state.cycleDetected) {
            cycleComponent = <div>Cycle detected</div>
            this.hideFeedbackComponentsAfterTimeout();
        }

        var justAddedComponent = "";
        if(this.state.justAdded) {
            justAddedComponent = <div>👍</div>
            this.hideFeedbackComponentsAfterTimeout();
        }

        return (
            <div>
                <h5>Dependency</h5>

                <ConceptSelectFromComponent 
                    store={this.props.store} 
                    parent={this} 
                    value={this.state.from || ""} 
                    concepts = {this.state.concepts} />

                <ConceptSelectToComponent 
                    store={this.props.store} 
                    parent={this} 
                    value={this.state.to || ""} 
                    concepts = {this.state.concepts} />

                <button className="btn" 
                        onClick={this.addDependency} 
                        disabled={!this.isEnabled()}>Add</button>

                {cycleComponent}
                {justAddedComponent}
            </div>
        );
    },

    hideFeedbackComponentsAfterTimeout: function() {
        if(this._timer) {
            clearTimeout(this._timer);
        }

        var self = this;
        this._timer = setTimeout(function() {
            self.setState({
                cycleDetected: false,
                justAdded: false
            });
        }, 2000);
    },

    onConceptSelected: function(label, value) {
        label = label.toLowerCase();
        value = value || null;

        var partialState = {};
        partialState[label] = value;
        this.setState(partialState);
    },

    addDependency: function() {

        var isAdded = this.props.store.addDependency(this.state.from, this.state.to);    
        
        this.setState({
            from: null,
            to: null,
            cycleDetected: !isAdded,
            justAdded: isAdded
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

        this.listenTo(this.store, "add:dependency", this.refreshGraphView);
    },

    render: function() {
        var courseNameAndPublishContainer = $("<div>").addClass("row");
        this.courseNameContainer = $("<div>").addClass("col-md-6");
        this.coursePublishContainer = $("<div>").addClass("col-md-6");
        
        courseNameAndPublishContainer.append(this.courseNameContainer)
                                     .append(this.coursePublishContainer);

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

        this.$el.append(courseNameAndPublishContainer)
                .append(conceptContainer);

        return this; 
    },

    renderChildren: function() {
        this.addCourseName()
            .addCoursePublish()
            .addConceptName()
            .addConceptList()
            .addConceptSelectDependency()
            .addGraphView();

        return this;
    },

    //todo -> unmount components
    addCourseName: function() {
        ReactDOM.render(<CourseNameComponent store={this.options.store} />, 
            this.courseNameContainer[0]); 
        return this;
    },

    addCoursePublish: function() {
        ReactDOM.render(<CoursePublishComponent store={this.options.store} />, 
            this.coursePublishContainer[0]);
        return this;
    },

    addConceptName: function() {
        ReactDOM.render(<ConceptNameComponent store={this.options.store} />, 
            this.conceptNameContainer[0]); 
        return this;
    },

    addConceptList: function() {
        ReactDOM.render(<ConceptListComponent store={this.options.store} />, 
            this.listContainer[0]);
        return this;
    },

    addConceptSelectDependency: function() {
        ReactDOM.render(<ConceptDependencyComponent store={this.options.store} />, 
            this.dependencyContainer[0]);
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

    // remove: function() {

    // }
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
