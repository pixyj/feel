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

var ConceptModel = require("./models").ConceptModel;

var components = require("./components.jsx");
var SectionHeadingComponent = components.SectionHeadingComponent;


var ConceptStore = function(options) {

    this.model = new ConceptModel(options);
};

ConceptStore.prototype = {

    fetch: function() {
        return this.model.fetch();
    }
};

ConceptStore.prototype.constructor = ConceptStore;

var PageComponent = React.createClass({

    render: function() {



        return (
            <div> Hi There </div>
        );
    }
});

var renderPage = function(conceptStore, element) {
    ReactDOM.render(<PageComponent conceptStore={conceptStore} />, element);
};

var app = {};


var render = function(options, element) {
    app.conceptStore = new ConceptStore(options);

    app.conceptStore.fetch().then(function() {
        renderPage(app.conceptStore, element);
    });
};

var unmount = function() {

};

module.exports = {
    render: render, 
    unmount: unmount
}

