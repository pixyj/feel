var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");
var RadioGroup = require("radio-group.jsx").RadioGroup;

var models = require("./models");
var CreatorStore = models.CreatorStore;
var StudentStore = models.StudentStore;
var PretestModel = models.PretestModel;
var StudentStates = models.StudentStates;

var quizModels = require("./../../quiz/js/models");
var QuizAttemptStore = quizModels.QuizAttemptStore;
var QuizAttemptCollection = quizModels.QuizAttemptCollection;

var StudentSingleQuizView = require("./../../quiz/js/quiz-student-view.jsx").StudentSingleQuizView;

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

        this._pretestState = {
            startLearningAtConcept: null,
            currentConceptIndex: 1,
            hasAnsweredAllQuizzes: false,
            previousAttemptResult: null
        };

        //#todo -> Change to this._channel.on
        this.on("add:attempt", this._updatePretestState, this);
    },

    isLastQuestionAnswered: function() {
        return this._pretestState.currentConceptIndex === this._orderedConcepts.length - 1;
    },

    _updatePretestState: function(attempt) {
        if(attempt.result) {
            if(this._pretestState.currentConceptIndex === this._orderedConcepts.length - 1) {
                this._pretestState.hasAnsweredAllQuizzes = true;
                this.trigger("complete:pretest", this._pretestState);
            }
            else if(this._pretestState.previousAttemptResult === false) {
                this._pretestState.startLearningAtConcept = this._orderedConcepts[this._pretest.currentConceptIndex];
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
                this.trigger("complete:pretest", this._pretestState);
            }
            else if(this._pretestState.previousAttemptResult === true) {
                var currentConceptIndex = this._pretestState.currentConceptIndex;
                var startLearningAtConceptIndex = currentConceptIndex;
                this._pretestState.startLearningAtConcept = this._orderedConcepts[startLearningAtConceptIndex];
                this.trigger("complete:pretest", this._pretestState);
            }
            else {
                this._pretestState.currentConceptIndex -= 1;
                this._pretestState.previousAttemptResult = false;
            }
        }
    },

    getPretestCompletionConcept: function() {
        return this._pretest.startLearningAtConcept;
    },

    getNextPretestConcept: function() {
        return this._orderedConcepts[this._pretestState.currentConceptIndex];
    },

    getNextPretestQuizAndHighlightConcept: function() {
        var concept = this._orderedConcepts[this._pretestState.currentConceptIndex];
        
        quiz = this._pretest.getConceptQuiz(concept.id);
        utils.assert(quiz, "/{0}/{1}/ does not have a PRETEST Quiz".format(
            this.getCourseName(), concept.slug));

        this.trigger("highlight:concept", concept);

        return quiz;

    },

    cleanup: function() {
        //todo
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
            <div>
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
            <div>
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
            <div>
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

// else {
//     var props = STUDENT_SKILL_ESTIMATION_LEVELS[this.state.level].props;
//     props.store = this.props.store;
//     var ComponentClass = this.getLevelComponentClass(this.state.level);
//     levelComponent = <ComponentClass {...props} />
// }
var PretestComponent = React.createClass({

    getInitialState: function() {
        
        return {
            quiz: null,
            showNextBtn: false,
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
        this.props.store.on("add:attempt", this.showNextBtn, this);
    },

    componentWillUnmount: function() {
        
        this.props.store.off("add:attempt", this.showNextBtn, this);
        this.props.store.off("complete:pretest", this.updateIsPretestCompleted);

    },

    // todo -> This code can be improved. The logic has to be moved to the store
    // and the view can remain 'dumb'. But I'm under a deadline and this works.
    showNextBtn: function(attempt) {
        if(!attempt.result) {
            return;
        }

        if(this.props.store.isLastQuestionAnswered()) {
            return;
        }
        
        console.debug("in showNextBtn", attempt);
        var self = this;
        setTimeout(function() {
            self.setState({
                showNextBtn: true,
                quiz: null
            });
            self._scrollToTop();
            self._showNextPretestAfterTimeout();
            //hack
            self.props.parent.highlightConcept(self.props.store.getNextPretestConcept());
        }, 2000);
    },

    _scrollToTop: function() {
        height = $("#user-status").height() + $("h3").height();
        $(window).scrollTop(height);
    },

    _showNextPretestAfterTimeout: function() {
        this._setCountdown(3);
    },

    _setCountdown: function(countdown) {
        var self = this;

        if(countdown === 0) {
            this.showNextPretestQuiz();
            return;
        }

        this.setState({
            countdown: countdown
        });
        var self = this;
        setTimeout(function() {
            self._setCountdown(countdown - 1);
        }, 1000);
    },



    updateQuiz: function(quiz) {
        this.setState({
            quiz: quiz
        });
    },

    updateIsPretestCompleted: function(pretestStateAttrs) {
        console.debug("in updateIsPretestCompleted");
        this._pretestStateAttrs = pretestStateAttrs;
        var self = this;
        this._pretestButtonTimer = setTimeout(function() {
            self.setState({
                isPretestCompleted: true,
                showNextBtn: false,
                quiz: null
            });
            self._scrollToTop();
        }, 2000);
    },

    ALL_QUESTIONS_ANSWERED_MESSAGE: "Awesome! Select any concept you'd like to review and start learning.",

    render: function() {

        var startLearningAtComponent = "";
        if(this.state.isPretestCompleted) {
            if(this._pretestStateAttrs.hasAnsweredAllQuizzes) {
                startLearningAtComponent = <h5>{this.ALL_QUESTIONS_ANSWERED_MESSAGE}</h5>
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
                                attemptStore={this.props.store.getAttemptStore()} />

        }
        var nextBtn = ""; 
        var nextConcept;
        var nextBtnString = "";
        if(this.state.showNextBtn) {
            nextConcept = this.props.store.getNextPretestConcept();
            if(nextConcept) {
                nextBtn = <h5 id="course-pretest-next-concept-heading">Correct! Next up, a question on 
                                <b> {nextConcept.name}</b>
                          </h5>
            }
        }
        var countdown = "";
        if(this.state.countdown) {
            countdown = <h4 id="course-pretest-countdown">{this.state.countdown}</h4>
        }
        return (
            <div id="course-pretest-container">
                {startLearningAtComponent}
                {nextBtn}
                {countdown}
                {quizComponent}

            </div>
        );
    },

    showNextPretestQuiz: function() {
        if(this._nextButtonTimer) {
            clearTimeout(this._nextButtonTimer);
        }
        var quiz = this.props.store.getNextPretestQuizAndHighlightConcept();

        this.setState({
            showNextBtn: false,
            countdown: null,
            quiz: quiz
        });
    }
});

var DashboardComponent = React.createClass({

    render: function() {
        return (
            <h4>This is your dashboard </h4>
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

        var StateComponentClass = StudentStateComponents[this.state.state];
        var stateComponent = <StateComponentClass 
                                store={this.props.store} 
                                parent={this} />

        return (
            <div>
                <h3> Welcome to {this.props.store.getCourseName()}  </h3>
                <div className="row">
                    <div className="col-xs-12 col-md-6" ref="graphContainer">
                    </div>
                    <div className="col-xs-12 col-md-6">
                        {stateComponent}
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
    },

    highlightConcept: function(concept) {
        this.graphView.highlightNode(concept.id);
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