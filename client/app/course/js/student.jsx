var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");
var RadioGroup = require("radio-group.jsx").RadioGroup;

var models = require("./models");
var CreatorStore = models.CreatorStore;
var StudentStore = models.StudentStore;
var PretestModel = models.PretestModel;

var quizModels = require("./../../quiz/js/models");
var QuizAttemptStore = quizModels.QuizAttemptStore;
var QuizAttemptCollection = quizModels.QuizAttemptCollection;

var connected = require("./../../conceptviz/js/connected");

var ProgressBar = require("top-progress-bar");

/********************************************************************************
*   Store
*
*
*********************************************************************************/

var Store = function(options) {
    this.id = options.id;
    this._creator = new CreatorStore({
        id: this.id,
        setRoute: false
    });
    
    this._student = new StudentStore({
        id: this.id
    });

    this._attempt = new QuizAttemptStore({
        attemptCollection: new QuizAttemptCollection({}),
        channel: this
    });

    this.initializeStoreAPIs(this._creator, this.creatorAPIs);
    this.initializeStoreAPIs(this._student, this.studentAPIs);
    this.initializeStoreAPIs(this._attempt, this.attemptAPIs);

    this._pretest = new PretestModel({
        id: this.id
    });


};

Store.prototype = {

    fetch: function() {

        var one = this._creator.fetch();
        var two = this._student.fetch();
        var promises = [one, two];

        var mergedPromise = $.when.apply($, promises);

        return mergedPromise;            
    },

    //provide a declarative way to proxy methods defined in Creator and Student stores
    creatorAPIs: {
        'getCourseName': 'getName',
        'getRootConcept': 'getRootConcept',
        'getConceptURL': 'getConceptURL'
    },

    studentAPIs: {
        'getSkillEstimationLevel': 'getSkillEstimationLevel',
        'setSkillEstimationLevel': 'setSkillEstimationLevel'
    },

    attemptAPIs: {
        'addAttempt': 'addAttempt',
    },

    initializeStoreAPIs: function(store, methodMap) {

        var self = this;
        _.each(methodMap, function(storeMethod, myMethod) {
            this[myMethod] = function() {
                return store[storeMethod].apply(store, arguments);
            };
        }, this);
    },

    getGraph: function() {
        var graph = this._creator.getGraph();
        var progressByConceptId = this._student.getProgress();

        var length = graph.levels.length;
        for(var i = 0; i < length; i++) {
            var levelNodes = graph.levels[i];
            var levelLength = levelNodes.length;
            for(var j = 0; j < levelLength; j++) {
                var node = levelNodes[j];
                node.progress = progressByConceptId[node.id].progress; 
                node.url = this.getConceptURL(node.slug);
            }
        }
        return graph;
    },

    fetchPretest: function() {

        var promise = $.Deferred();
        var self = this;
        this._pretest.fetch().then(function() {
            promise.resolve({
                quizzes: self._pretest.attributes,
                attemptStore: self._attempt
            });
        });

        return promise;
    },

    cleanup: function() {
        //todo
    }

};

Store.prototype.constructor = Store;


/********************************************************************************
*  COMPONENTS
*
*  
*********************************************************************************/


/*----------------------------Estimation Components-----------------------------*/

var StartLearningAtMixin = {

    render: function() {
        var concept = this.getStartLearningAtConcept();
        this._cachedConcept = concept;
        return (
            <div>
                <h5>You can start learning at <i>{concept.name}</i></h5>
                <button className="btn btn-large" 
                        onClick={this.routeToConcept}>
                        Start Learning! 
                </button>
            </div>
        );
    },

    routeToConcept: function() {
        var url = this.props.store.getConceptURL(this._cachedConcept.slug);
        Backbone.history.navigate(url, {trigger: true});
    }
};

var CompletelyNewComponent = React.createClass({

    mixins: [StartLearningAtMixin],

    getStartLearningAtConcept: function() {
        return this.props.store.getRootConcept();
    }

});

var QuizOrBrowseComponent = React.createClass({

    getInitialState: function() {
        return {
            showQuiz: false
        }
    },

    render: function() {

        return (
            <div>
                <h5>Awesome. You can take a short test so that you get started at the right level for you
                        OR you can select any concept on the graph </h5> 
                <button className="btn btn-large" onClick={this.startQuiz}> Start Quiz </button>
            </div>
        );
    },

    startQuiz: function() {
        this.setState({
            startQuiz: true
        });
    }
});

/*----------------------------Estimation Configuration -----------------------------*/

var STUDENT_SKILL_ESTIMATION_LEVELS = [
    {
        value: 0,
        display: "I'm completely new",
        ComponentClass: CompletelyNewComponent,
        props: {
            quizStartPoint: null
        }
    },
    {
        value: 1,
        display: "I consider myself a beginner",
        ComponentClass: QuizOrBrowseComponent,
        props: {
            quizStartPoint: 0.25
        }
    },
    {
        value: 2,
        display: "I've studied these topics, but I'm a bit rusty.",
        ComponentClass: QuizOrBrowseComponent,
        props: {
            quizStartPoint: 0.5
        }
    },
    {
        value: 3,
        display: "I'm familiar with most/all of these topics.",
        ComponentClass: QuizOrBrowseComponent,
        props: {
            quizStartPoint: 0.75
        }
    }
];

/*------------------------Root Estimation Component -----------------------------*/

var StudentSkillEstimationComponent = React.createClass({

    getInitialState: function() {
        return {
            level: this.props.store.getSkillEstimationLevel()
        };
    },

    getLevelComponentClass: function(level) {
        return STUDENT_SKILL_ESTIMATION_LEVELS[level].ComponentClass;
    },

    render: function() {

        var radioGroup = "";
        var levelComponent = "";
        var heading = "";
        if(this.state.level === null) {
            heading = <h4>Which of these describes you best?</h4>
            var rows = [];
            var levels =  STUDENT_SKILL_ESTIMATION_LEVELS;
            radioGroup = <RadioGroup items={levels} onChange={this.onSkillEstimated} parent={this}/>
        }
        else {
            var props = STUDENT_SKILL_ESTIMATION_LEVELS[this.state.level].props;
            props.store = this.props.store;
            var ComponentClass = this.getLevelComponentClass(this.state.level);
            levelComponent = <ComponentClass {...props} />
        }

        return (
            <div>
                {heading}
                {radioGroup}
                {levelComponent}
            </div>
        );
    },

    onSkillEstimated: function(level) {
        console.log("Skill estimated:");
        this.setState({
            level: level
        });
        this.props.store.setSkillEstimationLevel(level);
    }
});

var PretestComponent = React.createClass({

    render: function() {
        return (
            <h4> Are you ready </h4>
        );
    }
});

/*------------------------------------PAGE--------------------------------------*/

var PageComponent = React.createClass({

    componentDidMount: function() {
        this.renderGraph();
    },

    render: function() {

        var leftComponent = "";
        if(false) {
            leftComponent = <StudentSkillEstimationComponent parent={this} store={this.props.store} />
        }
        else {
            leftComponent = <PretestComponent store={this.props.store} />
        }

        return (
            <div>
                <h3> Welcome to {this.props.store.getCourseName()}  </h3>
                <div className="row"> 
                    <div className="col-xs-5 col-md-6">
                        {leftComponent}
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
        var graphContainer = $(ReactDOM.findDOMNode(this.refs.graphContainer));
        this.graphView = connected.render({
            width: graphContainer.width(),
            showProgress: true
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
    ProgressBar.setProgress(0.2);
    console.log("hi", arguments);

    var store = new Store(options);
    store.fetch().then(function() {
        ProgressBar.setProgress(0.8);
        ReactDOM.render(<PageComponent store={store} />, element); 
        ProgressBar.setProgress(1);
    });

    app.store = store;
    app.element = element;

    window.store = store;

};

var unmount = function() {

};

module.exports = {
    render: render,
    unmount: unmount
}