var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

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

var components = require("./components.jsx");
var SectionHeadingComponent = components.SectionHeadingComponent;
var SectionComponentListMixin = components.SectionComponentListMixin;



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
            attemptStore: this.props.attemptStore
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

var renderImpl = function(pageStore, attemptStore, element) {

    var page = pageStore.toJSON();
    attemptStore.setSectionQuizzes(page.sectionQuizzes).initializeAttempts();
    ReactDOM.render(<PageComponent page={page} attemptStore={attemptStore} />, element);

    app.pageStore = pageStore;
    app.attemptStore  = attemptStore;
    app.element = element;

};

var render = function(options, element) {

    var model = new StudentCourseConceptPageModel(options);
    
    model.fetch().then(function() {
        
        var pageModel = new StudentConceptPageModel(model.attributes.page)
        var pageStore = new PageStore({
            model: pageModel
        });

        var attemptCollection = new QuizAttemptCollection(model.attributes.quizattempts);
        var attemptStore = new QuizAttemptStore({
            attemptCollection: attemptCollection
        });

        renderImpl(pageStore, attemptStore, element);

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

    var one = pageStore.fetch();
    var two = attemptStore.fetch();
    var promises = [one, two];

    $.when.apply($, promises).then(function() {
        renderImpl(pageStore, attemptStore, element);
    });
};


var unmount = function() {

    app.pageStore.cleanup();
    app.attemptStore.cleanup();
    ReactDOM.unmountComponentAtNode(app.element);
};

module.exports = {
    render: render, 
    renderPreview: renderPreview,
    unmount: unmount
}

