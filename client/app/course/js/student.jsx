var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");
var RadioGroup = require("radio-group.jsx").RadioGroup;
var MarkdownDisplayComponent = require("markdown-and-preview.jsx").MarkdownDisplayComponent;
var md = require("md");

var models = require("./models");
var CreatorStore = models.CreatorStore;
var StudentStore = models.StudentStore;
var PretestModel = models.PretestModel;
var StudentStates = models.StudentStates;

var quizModels = require("./../../quiz/js/models");
var QuizAttemptStore = quizModels.QuizAttemptStore;
var QuizAttemptCollection = quizModels.QuizAttemptCollection;

var StudentSingleQuizView = require("./../../quiz/js/quiz-student-view.jsx").StudentSingleQuizView;

var GraphView = require("./../../conceptviz/js/graph").GraphView;

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
        id: this.id,
        channel: this
    });

    this._attempt = new QuizAttemptStore({
        attemptCollection: new QuizAttemptCollection({}),
        channel: this
    });

    this._pretest = new PretestModel({
        id: this.id
    });

    this._initializeStoreAPIs(this._creator, this.creatorAPIs);
    this._initializeStoreAPIs(this._student, this.studentAPIs);
    this._initializeStoreAPIs(this._attempt, this.attemptAPIs);
    this._initializeStoreAPIs(this._pretest, this.pretestAPIs);

    //#todo -> Change to this._channel.on
    this.on("add:attempt", this._updatePretestState, this);
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
        'getCourseIntro': 'getCourseIntro',
        'getRootConcept': 'getRootConcept',
        'getConceptURL': 'getConceptURL',
        'getConceptAndPrereqsSubgraph': 'getConceptAndPrereqsSubgraph'
    },

    studentAPIs: {
        'getSkillEstimationLevel': 'getSkillEstimationLevel',
        'setSkillEstimationLevel': 'setSkillEstimationLevel',
        'getState': 'getState',
        'setState': 'setState'
    },

    attemptAPIs: {
        'addAttempt': 'addAttempt',
    },

    pretestAPIs: {
        'getConceptQuiz': 'getConceptQuiz'
    },

    _initializeStoreAPIs: function(store, methodMap) {

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

    getAttemptStore: function() {
        return this._attempt;
    },

    fetchPretest: function() {

        var promise = $.Deferred();
        var self = this;
        this._pretest.fetch().then(function() {
            self.initializePretest();
            promise.resolve({
                quizzes: self._pretest.attributes,
                attemptStore: self._attempt
            });
        });

        return promise;
    },

    initializePretest: function() {
        var conceptsInLevels = this.getGraph().levels;
        this._orderedConcepts = _.flatten(conceptsInLevels);

        this._levelIndexByConceptId = {};
        var depth = conceptsInLevels.length;
        for(var i = 0; i < depth; i++) {
            var level = conceptsInLevels[i];
            var levelLength = level.length;
            for(var j = 0; j < levelLength; j++) {
                var concept = level[j];
                this._levelIndexByConceptId[concept.id] = i;
            }
        }

        var selfEstimationLevel = this.getSkillEstimationLevel();
        var fractionEstimated = SELF_SKILL_ESTIMATION_LEVELS[selfEstimationLevel].props.quizStartPoint;
        var length = this._orderedConcepts.length;
        var initialConceptIndex = Math.floor(length * fractionEstimated);

        this._pretestState = {
            startLearningAtConcept: null,
            currentConceptIndex: initialConceptIndex,
            hasAnsweredAllQuizzes: false,
            previousAttemptResult: null
        };
    },

    addIncorrectMockAttempt: function(attempt) {
        this._updatePretestState(attempt);
    },

    _updatePretestState: function(attempt) {
        console.log("in _updatePretestState");
        if(attempt.result) {
            if(this._pretestState.currentConceptIndex === this._orderedConcepts.length - 1) {
                this._pretestState.hasAnsweredAllQuizzes = true;
                this.off("add:attempt");
                this.trigger("complete:pretest", this._pretestState);
            }
            else if(this._pretestState.previousAttemptResult === false) {
                this._pretestState.startLearningAtConcept = this._orderedConcepts[this._pretestState.currentConceptIndex + 1];
                this.off("add:attempt");
                this.trigger("complete:pretest", this._pretestState);
            }
            else {
                this._pretestState.currentConceptIndex += 1;
                this._pretestState.previousAttemptResult = true;
            }
        }
        else {
            if(this._pretestState.currentConceptIndex === 0) {
                this._pretestState.startLearningAtConcept = this._orderedConcepts[0];
                this.off("add:attempt");
                this.trigger("complete:pretest", this._pretestState);
            }
            else if(this._pretestState.previousAttemptResult === true) {
                var currentConceptIndex = this._pretestState.currentConceptIndex;
                var startLearningAtConceptIndex = currentConceptIndex;
                this._pretestState.startLearningAtConcept = this._orderedConcepts[startLearningAtConceptIndex];
                this.off("add:attempt");
                this.trigger("complete:pretest", this._pretestState);
            }
            else {
                this._pretestState.currentConceptIndex -= 1;
                this._pretestState.previousAttemptResult = false;
            }
        }
    },

    getPretestCompletionConcept: function() {
        return this._pretestState.startLearningAtConcept;
    },

    getNextPretestConcept: function() {
        return this._orderedConcepts[this._pretestState.currentConceptIndex];
    },

    getLevelIndexByConceptId: function(id) {
        return this._levelIndexByConceptId[id];
    },

    getCurrentLevelIndex: function() {
        var concept = this.getNextPretestConcept();
        return this.getLevelIndexByConceptId(concept.id);
    },

    getNextPretestQuizAndHighlightConcept: function() {
        var conceptsInLevels = this.getGraph().levels;
        orderedConcepts = _.flatten(conceptsInLevels);
        var concept = orderedConcepts[this._pretestState.currentConceptIndex];
        
        quiz = this._pretest.getConceptQuiz(concept.id);
        utils.assert(quiz, "/{0}/{1}/ does not have a PRETEST Quiz".format(
            this.getCourseName(), concept.slug));

        this.trigger("highlight:concept", concept);

        return quiz;

    },

    getUpNextConcept: function() {
        var conceptsInLevels = this.getGraph().levels;
        orderedConcepts = _.flatten(conceptsInLevels);
        var length = orderedConcepts.length;

        var allConceptsProgress = this._student.getProgress();

        for(var i = length - 1; i >= 0; i--) {
            var concept = orderedConcepts[i];
            var progress = allConceptsProgress[concept.id].progress;
            if(progress === 1) {
                break;
            }
        }
        if(i === length - 1) {
            return null;
        }
        return orderedConcepts[i+1];
    },

    cleanup: function() {
        this.off();
    }

};

_.extend(Store.prototype, Backbone.Events);
Store.prototype.constructor = Store;

/********************************************************************************
*  Components
*
*
*********************************************************************************/

var StartLearningAtMixin = {

    render: function() {

        var concept = this.props.concept || this.getStartLearningAtConcept();
        this._url = this.props.store.getConceptURL(concept.slug);

        return (
            <div id="course-start-learning-at-container" className={this.props.className}>
                <h5>You can start learning at <a href={this._url}> {concept.name}</a>
                </h5>
                <button className="btn btn-large"
                        id="course-start-learning-btn" 
                        onClick={this.routeToConcept}>
                        Start Learning! 
                </button>
            </div>
        );
    },

    componentDidMount: function() {
        var el = $("#course-start-learning-at-container");
        $('body,html').animate({
            scrollTop: el.offset().top - 20
        }, 500);
    },

    routeToConcept: function() {
        Backbone.history.navigate(this._url, {trigger: true});
    }
};

var StartLearningAtComponent = React.createClass(StartLearningAtMixin);


var CompletelyNewComponent = React.createClass({

    mixins: [StartLearningAtMixin],

    getStartLearningAtConcept: function() {
        return this.props.store.getRootConcept();
    }

});


var PretestCompletedComponent = React.createClass({
    
    mixins: [StartLearningAtMixin],

    getStartLearningAtConcept: function() {
        return this.props.store.getPretestCompletionConcept();
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
            <div className={this.props.className}>
                <h5>You can take a short test to get started at the right concept for you
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

var SELF_SKILL_ESTIMATION_LEVELS = [
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
        display: "I'm aware of these topics, but I'm a bit rusty.",
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

var SelfSkillEstimationComponent = React.createClass({

    getLevelComponentClass: function(level) {
        return STUDENT_SKILL_ESTIMATION_LEVELS[level].ComponentClass;
    },

    HEADING: "Which of these describes you best?",

    render: function() {
        
        var levels =  SELF_SKILL_ESTIMATION_LEVELS;
        var hideOnSelection = true;
        var radioGroup = <RadioGroup 
                            items={levels} 
                            onChange={this.onSkillEstimated} 
                            parent={this} 
                            hideOnSelection={hideOnSelection} />

        return (
            <div className={this.props.className}>
                <h5 text-align="center"> {this.HEADING} </h5>
                {radioGroup}
            </div>
        );
    },

    onSkillEstimated: function(level) {
        console.log("Skill estimated:");
        this.props.store.setSkillEstimationLevel(level);

        var nextState = (level === 0) ? StudentStates.COMPLETELY_NEW : StudentStates.PRETEST;
        this.props.store.setState(nextState);
    }
});

ALL_QUESTIONS_ANSWERED_MESSAGE: "Awesome! Select any concept you'd like to review and start learning.";

var PretestComponent = React.createClass({

    getInitialState: function() {
        
        return {
            quiz: null,
            showNextQuiz: false,
            isPretestCompleted: false,
            countdown: null
        };

    },

    componentWillMount: function() {

        var self = this;
        ProgressBar.setProgress(0.2);
        this.props.store.fetchPretest().then(function() {
            ProgressBar.setProgress(1);
            self.showNextPretestQuiz();
        });

        this.props.store.on("complete:pretest", this.updateIsPretestCompleted, this);
        this.props.store.on("add:attempt", this.showNextQuiz, this);
        window.s = this;
        
    },

    componentDidMount: function() {
        this.renderGraph();
    },

    componentWillUnmount: function() {
        
        this.props.store.off("add:attempt", this.showNextQuiz, this);
        this.props.store.off("complete:pretest", this.updateIsPretestCompleted);
        this.graphView.remove();

    },

    // todo -> This code can be improved. The logic has to be moved to the store
    // and the view can remain 'dumb'. But I'm under a deadline and this works.
    showNextQuiz: function(attempt, timeout) {

        var timeout = timeout || 2000;

        console.debug("in showNextQuiz", attempt);
        var self = this;
        this._nextQuizTimer = setTimeout(function() {

            //hack. The timer should be cleared in 
            //_updatePretestState. But it isn't 
            if(self.state.isPretestCompleted) {
                return;
            }
            self.setState({
                showNextQuiz: true,
                quiz: null
            });
            
            self._showNextPretestAfterTimeout();
           
        }, timeout);
    },

    _showNextPretestAfterTimeout: function() {
        if(this.state.isPretestCompleted) {
            return;
        }
        this.showNextPretestQuiz();
    },

    updateQuiz: function(quiz) {
        this.setState({
            quiz: quiz
        });
    },

    _scrollToTop: function() {
        this.$pretest = this.$pretest || $("#course-pretest-container");
        this.$documentBody = this.$documentBody || $('body,html');
        this.$documentBody.animate({
            scrollTop: this.$pretest.offset().top
        }, 500);
    },

    showNextPretestQuiz: function() {
        if(this._nextButtonTimer) {
            clearTimeout(this._nextButtonTimer);
        }
        var quiz = this.props.store.getNextPretestQuizAndHighlightConcept();

        this.setState({
            showNextQuiz: false,
            countdown: null,
            quiz: quiz
        });

        var concept = this.props.store.getNextPretestConcept()
        this.props.parent.highlightConcept(concept);

        var subgraph = this.props.store.getConceptAndPrereqsSubgraph(concept.id);
        console.info("subgraph", subgraph);
        this.graphView.refresh(subgraph);
        this.graphView.activateNode(concept.id, {
            removePrevious: true
        });
        this._scrollToTop();
    },

    updateIsPretestCompleted: function(pretestStateAttrs) {
        console.debug("in updateIsPretestCompleted");
        this._pretestStateAttrs = pretestStateAttrs;
        clearTimeout(this._nextQuizTimer);
        var self = this;
        this._pretestButtonTimer = setTimeout(function() {
            self.setState({
                isPretestCompleted: true,
                showNextQuiz: false,
                quiz: null,
                countdown: null
            });
            self.graphView.remove();
            self.props.parent.deactivateCurrentConcept();
        }, 2000);
    },

    onSkipBtnClicked: function() {
        var attempt = {
            result: false
        };
        this.props.store.addIncorrectMockAttempt(attempt);
        this.showNextQuiz(attempt, 200);
    },

    render: function() {

        var startLearningAtComponent = "";
        if(this.state.isPretestCompleted) {
            if(this._pretestStateAttrs.hasAnsweredAllQuizzes) {
                startLearningAtComponent = 
                    <h5 id="course-all-questions-answered">
                        {ALL_QUESTIONS_ANSWERED_MESSAGE}
                    </h5>
            }
            else {
                startLearningAtComponent = <StartLearningAtComponent 
                                            concept={this._pretestStateAttrs.startLearningAtConcept}
                                            store={this.props.store} />
            }
        }

        var quizComponent = "";
        if(this.state.quiz !== null) {
            quizComponent = <StudentSingleQuizView 
                                quiz={this.state.quiz} 
                                attemptStore={this.props.store.getAttemptStore()} 
                                isCoursePretestQuiz={true} 
                                showHorizontalLine={false} 
                                showSkipBtn={true} 
                                onSkipBtnClicked={this.onSkipBtnClicked} />

        }
        var nextBtn = ""; 
        var nextConcept;
        var nextBtnString = "";
        if(this.state.showNextQuiz) {
            nextConcept = this.props.store.getNextPretestConcept();
            if(nextConcept) {
                nextBtn = <h5 id="course-pretest-next-concept-heading">Next up, a question on 
                                <b> {nextConcept.name}</b>
                          </h5>
            }
        }
        var countdown = "";
        if(this.state.countdown) {
            countdown = <h4 id="course-pretest-countdown">{this.state.countdown}</h4>
        }
        var hereComponent = "";
        var hereMessage = "";
        if(!this.state.isPretestCompleted) {
            hereComponent = <h5 className="center">{hereMessage}</h5>
        }
        return (
            <div id="course-pretest-container" className={this.props.className}>
                <div className="row">
                    <div className="col-xs-6 col-md-7">
                        {startLearningAtComponent}
                        {nextBtn}
                        {quizComponent}
                    </div>
                    <div className="col-xs-6 col-md-5">
                        {hereComponent}
                        <div ref="graphContainer">
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    renderGraph: function() {
        var graphContainer = $(ReactDOM.findDOMNode(this.refs.graphContainer));
        this.graphView = new GraphView({
            parent: graphContainer,
            graph: {levels: [], edges: []}
        });
        graphContainer.append(this.graphView.$el);
        this.graphView.render();
        return this;
    }
});


var DashboardComponent = React.createClass({

    render: function() {
        var upNextConcept = this.props.store.getUpNextConcept();
        if(!upNextConcept) {
            return (
                <div className={this.props.className}>
                    <h4 className="center" 
                           id="course-student-dashboard">
                           Pick a concept and start learning!
                    </h4>
                </div>
            );
        }

        var url = this.props.store.getConceptURL(upNextConcept.slug);
        var name = upNextConcept.name;
        return (
            <div className="center card" id="course-student-dashboard">
                  <h4><a href={url}>
                        <span id="course-concept-up-next">
                            Up Next:
                        </span>
                        <span>
                            {name}
                        </span>
                       </a>
                  </h4>
            </div>
        );

    }

});

/********************************************************************************
*  Student States -> Component map
*
*  
*********************************************************************************/
var SS = StudentStates;

var StudentStateComponents = function() {

    var componentsByStateName = {
        NEW_VISITOR: SelfSkillEstimationComponent,
        COMPLETELY_NEW: CompletelyNewComponent,
        PRETEST: PretestComponent,
        DASHBOARD: DashboardComponent
    };

    var componentsByStateCode = {};
    _.each(componentsByStateName, function(component, name) {
        componentsByStateCode[StudentStates[name]] = component;
    });

    return componentsByStateCode;
}();

var PageComponent = React.createClass({

    /**
    * getInitialState is also used internally to update the state.
    */
    getInitialState: function() {
        return {
            state: this.props.store.getState()
        }
    },

    componentDidMount: function() {
        this.renderGraph();
    },

    componentWillMount: function() {
        this.props.store.on("change:state", this.updateState, this);
        this.props.store.on("highlight:concept", this.highlightConcept, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("change:state", this.updateState);
        this.props.store.off("highlight:concept", this.highlightConcept);
    },

    updateState: function() {
        this.setState(this.getInitialState());
    },

    render: function() {

        var intro = "";
        var takePretest = "";
        if(this.state.state === StudentStates.NEW_VISITOR) {
            var mdContent = this.props.store.getCourseIntro();
            var html = md.mdAndMathToHtml(mdContent);
            intro = <MarkdownDisplayComponent className="card" 
                                              id="course-intro" 
                                              display={html} />

            takePretest = <div className="card">
                            <button className="btn btn-large waves-effect" 
                                    id="course-start-pretest-btn"
                                    onClick={this.scrollToPretest}>
                                    Start Pretest
                            </button>
                          </div>
        }

        var StateComponentClass = StudentStateComponents[this.state.state];
        var stateComponent = <StateComponentClass 
                                store={this.props.store} 
                                parent={this} 
                                className="course-homepage-state-component card" />

        return (
            <div>
                <div className="row">
                    <div className="col-xs-12">
                        {intro}
                        {takePretest}
                        <h4 id="course-concepts-and-deps-heading" className="center"> Concepts and Dependencies </h4>
                    </div>
                    <div className="col-xs-12" ref="graphContainer">
                    </div>
                    <div className="col-xs-12" ref="stateComponent">
                        {stateComponent}
                    </div> 
                </div>
            </div>
        );
    },

    renderGraph: function() {
        var graphContainer = $(ReactDOM.findDOMNode(this.refs.graphContainer));
        this.graphView = new GraphView({
            parent: graphContainer,
            showProgress: true,
            graph: this.props.store.getGraph()
        });
        graphContainer.append(this.graphView.$el);
        this.graphView.render();
        return this;
    },

    highlightConcept: function(concept) {
        this.graphView.activateNode(concept.id, {
            removePrevious: true
        });
    },

    deactivateCurrentConcept: function() {
        this.graphView.deactivateCurrentNode();
    },

    scrollToPretest: function() {
        var el = $(".course-homepage-state-component");
        $('body,html').animate({
            scrollTop: el.offset().top - 20
        }, 2000);
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

        document.title = "{0} - ConceptCoaster".format(store.getCourseName());
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