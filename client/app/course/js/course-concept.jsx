var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");

var DAG = require("./../../conceptviz/js/DAG").DAG;
var GraphView = require("./../../conceptviz/js/graph").GraphView;

var ConceptStudent = require("./../../concept/js/api").Student;

var models = require("./models");

/********************************************************************************
*   Graph Store and Component
*********************************************************************************/

var GraphStore = Backbone.Model.extend({

    initialize: function(options) {
        this.options = options;

        this._course = new models.CourseModel({
            id: options.courseSlug
        });
        this._dag = new DAG({});
        this._concepts = new models.ConceptCollection([], {
            course: this._course,
            dag: this._dag
        });
        this._dependencies = new models.DependencyCollection({
            course: this._course,
            dag: this._dag
        });

        this._promise = $.Deferred();
    },

    getCourseName: function() {
        return this._course.attributes.name;
    },

    getConceptName: function() {
        return this._concepts.findWhere({slug: this.options.conceptSlug}).attributes.name;
    },

    fetch: function() {
        var items = [this._concepts, this._dependencies];
        var promises = _.map(items, function(item) {
            return item.fetch();
        });

        var self = this;
        return $.when.apply($, promises).then(function() {
            self._setupDataStructuresAfterModelsAreFetched();
            self._promise.resolve();
        });
        
    },

    _setupDataStructuresAfterModelsAreFetched: function() {

        var dag = new DAG({});
        _.each(this._concepts.toJSON(), function(concept) {
            dag.addNode(concept);
        });
        _.each(this._dependencies.toJSON(), function(edge) {
            dag.addEdge(edge.from, edge.to);
        });
        var orderedConcepts = _.flatten(dag.sort());

        for(var i = 0, length = orderedConcepts.length; i < length; i++) {
            var concept = orderedConcepts[i];
            if(concept.slug === this.options.conceptSlug) {
                break;
            }
        }

        this._courseURL = "/course/{0}/".format(this.options.courseSlug);
        if(i === length - 1) {
            this._isLastConcept = true;
        }
        else {
            var upNext = orderedConcepts[i+1];
            this._isLastConcept = false;
            this._upNextConceptName = upNext.name;
            this._upNextConceptURL = "{0}{1}/".format(this._courseURL, upNext.slug);
        }
        this._setupCompleted = true;
    },

    toJSON: function() {
        utils.assert(this._setupCompleted, "GraphStore.toJSON called before it is ready");
        return {
            upNextConceptName: this._upNextConceptName,
            upNextConceptURL: this._upNextConceptURL,
            isLastConcept: this._isLastConcept,
            courseURL: this._courseURL

        };
    },

    getReady: function() {
        return this._promise;
    },

    cleanup: function() {

    }
});


var UpNextComponent = React.createClass({

    END_OF_TUTORIAL_MESSAGE: "You've reached the end of the tutorial!",

    getInitialState: function() {
        return {
            isReady: false
        }
    },

    componentDidMount: function() {

        var self = this;
        this.props.store.getReady().then(function() {
            self.timer = setTimeout(function() {
                self.setState({
                    isReady: true
                });
            }, 1000);

        });
    },

    componentWillUnmount: function() {
        clearTimeout(this._timer);
    },

    render: function() {
        if(!this.state.isReady) {
            return <div></div>
        }
        else {
            var props = this.props.store.toJSON();
            if(props.isLastConcept) {
                content =   <div className="center card">
                                <h5>
                                {this.END_OF_TUTORIAL_MESSAGE} <br/> <br/>
                                Go to your <a href={props.courseURL}>dashboard</a> and study a concept you may have not have completed yet. 
                                </h5>
                            </div>
            }
            else {
                content = <div className="center card">
                              <h4><a href={props.upNextConceptURL}>
                                    <span id="course-concept-up-next">
                                        Up Next:
                                    </span>
                                    <span>
                                        {props.upNextConceptName}
                                    </span>
                                   </a>
                              </h4>
                          </div>
            }
            return <div id="course-concept-next-up">{content}</div>
        }
    }

})

/********************************************************************************
*   React Components
*********************************************************************************/

var PageComponent = React.createClass({

    getInitialState: function() {
        return {
            isConceptStudentRendered: false
        }
    },

    componentDidMount: function() {
        ConceptStudent.render(this.props, this.refs.mainContent);
        this._graphRenderTimer = function(self) {
            return setTimeout(function() {
                self.setState({
                    isConceptStudentRendered: true
                });
            }, 200);
        }(this);
    },

    componentWillUnmount: function() {
        ConceptStudent.unmount();
        clearTimeout(this._graphRenderTimer);
    },

    render: function() {
        var upNext = "";
        if(this.state.isConceptStudentRendered) {
            upNext = <UpNextComponent store={this.props.graphStore} />
        }
        return (
            <div>
                <div ref="mainContent">
                </div>
                {upNext}
            </div>
        );
    }
});

/********************************************************************************
*   API
*********************************************************************************/

var app = {

};

var render = function(options ,element) {
    app.graphStore = new GraphStore(options);
    options.graphStore = app.graphStore;
    
    ReactDOM.render(<PageComponent {...options} />, element);
    app.element = element;

    app.graphStore.fetch().then(function() {
        var store = app.graphStore;
        var title = "{0}, {1} - ConceptCoaster".format(store.getConceptName(), options.courseSlug);
        document.title = title;
    });
};

unmount = function() {
    ReactDOM.unmountComponentAtNode(app.element);
    app.graphStore.cleanup();
};

module.exports = {
    render: render,
    unmount: unmount
};