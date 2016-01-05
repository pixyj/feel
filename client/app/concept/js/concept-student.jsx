var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");
var tags = require("tags.jsx");
var md = require("md");
var MarkdownAndPreviewMixin = require("markdown-and-preview.jsx").MarkdownAndPreviewAttrs;

var visualize = require("./../../matrixviz/js/api");
var matrixMultiply = visualize.matrixMultiply;

var QuizList = require("./../../quiz/js/quiz-list.jsx");
var QuizFilterComponent = QuizList.QuizFilterComponent;
var QuizSnippetComponent = QuizList.QuizSnippetComponent;

var QuizCreator = require("./../../quiz/js/quiz-creator-view.jsx");
var QuizCreatorModalComponent = QuizCreator.QuizCreatorModalComponent;

var conceptSectionTypes = require("./concept-section-types");
var SECTION_TYPES_AND_COMPONENTS = conceptSectionTypes.SECTION_TYPES_AND_COMPONENTS
var STUDENT_SECTION_COMPONENTS_BY_TYPE = conceptSectionTypes.STUDENT_SECTION_COMPONENTS_BY_TYPE;
var SECTIONS_SORTED_BY_TYPE = conceptSectionTypes.SECTIONS_SORTED_BY_TYPE;

var models = require("./models");
var StudentConceptPageModel = models.StudentConceptPageModel;
var StudentCourseConceptPageModel = models.StudentCourseConceptPageModel;

var QuizAttemptStore = require("./../../quiz/js/models").QuizAttemptStore;
var QuizAttemptCollection = require("./../../quiz/js/models").QuizAttemptCollection;

var CodeQuizAttemptStore = require("./../../code-quiz/js/models").CodeQuizAttemptStore;
var CodeQuizAttemptCollection = require("./../../code-quiz/js/models").CodeQuizAttemptCollection;

var components = require("./components.jsx");
var SectionHeadingComponent = components.SectionHeadingComponent;
var SectionComponentListMixin = components.SectionComponentListMixin;

var ProgressBar = require("top-progress-bar");

var PageStore = function(options) {

    this.model = options.model;
};

PageStore.prototype = {

    fetch: function() {
        return this.model.fetch();
    },

    toJSON: function() {
        return this.model.toJSON()
    },

    getSectionQuizzes: function() {
        return this.model.attributes.sectionQuizzes;
    },

    cleanup: function() {
        this.model.off();
    }
};

PageStore.prototype.constructor = PageStore;

var StudentConceptNameComponent = React.createClass({

    render: function() {

        var message = this.props.page.name;

        return (
            <h4> 
                {message}
            </h4>
        );
    }
});


var PageComponent = React.createClass({

    mixins: [SectionComponentListMixin],

    render: function() {

        var sections = this.props.page.sections;
        var props = {
            page: this.props.page,
            attemptStore: this.props.attemptStore,
            codeQuizAttemptStore: this.props.codeQuizAttemptStore
        };

        var components = this.getComponentList(sections, STUDENT_SECTION_COMPONENTS_BY_TYPE, props);
        return (
            <div> 
                <StudentConceptNameComponent page={this.props.page} />
                {components}
            </div>
        );
    }
});

var app = {};

var renderImpl = function(pageStore, attemptStore, codeQuizAttemptStore, element) {

    var page = pageStore.toJSON();
    attemptStore.setSectionQuizzes(page.sectionQuizzes).initializeAttempts();
    ReactDOM.render(<PageComponent  page={page} 
                                    attemptStore={attemptStore} 
                                    codeQuizAttemptStore={codeQuizAttemptStore}/>, element);

    app.pageStore = pageStore;
    app.attemptStore  = attemptStore;
    app.codeQuizAttemptStore = codeQuizAttemptStore;
    app.element = element;
    ProgressBar.setProgress(1);
};

var render = function(options, element) {
    ProgressBar.setProgress(0.2);

    var model = new StudentCourseConceptPageModel(options);
    var promises = [model.fetch()]; //I promise this, promise this, Check this hand cause I'm marvelous
    
    //todo -> handle error case.
    $.when.apply($, promises).then(function() {
        ProgressBar.setProgress(0.6);
        var pageModel = new StudentConceptPageModel(model.attributes.page)
        var pageStore = new PageStore({
            model: pageModel
        });

        var attemptCollection = new QuizAttemptCollection(model.attributes.quizattempts);
        var attemptStore = new QuizAttemptStore({
            attemptCollection: attemptCollection
        });

        ProgressBar.setProgress(0.8)
        var conceptId = model.attributes.page.id;
        var codeQuizAttemptStore = new CodeQuizAttemptStore({
            conceptId: conceptId,
            attemptCollection: new CodeQuizAttemptCollection(model.attributes.codequizattempts, {
                conceptId: conceptId
            })
        });
        renderImpl(pageStore, attemptStore, codeQuizAttemptStore, element);

    });
};


var renderPreview = function(options, element) {

    var pageStore = new PageStore({
        model: new StudentConceptPageModel({id: options.id})
    });

    var attemptStore = new QuizAttemptStore({
        attemptCollection: new QuizAttemptCollection({
            conceptId: options.id
        })
    });

    var codeQuizAttemptStore = new CodeQuizAttemptStore({
        conceptId: options.id
    });

    var one = pageStore.fetch();
    var two = attemptStore.fetch();
    var three = codeQuizAttemptStore.fetch();
    var promises = [one, two, three];

    ProgressBar.setProgress(0.2);
    $.when.apply($, promises).then(function() {
        ProgressBar.setProgress(0.8);
        renderImpl(pageStore, attemptStore, codeQuizAttemptStore, element);
    });
};


var unmount = function() {

    //unmount only if pageStore is fetched. 
    //If page is not found, don't do anything. 
    if(app.pageStore) {
        app.pageStore.cleanup();
        app.pageStore = null;
        app.attemptStore.cleanup();
        app.attemptStore = null;
        ReactDOM.unmountComponentAtNode(app.element);
    }
};

module.exports = {
    render: render, 
    renderPreview: renderPreview,
    unmount: unmount
}

