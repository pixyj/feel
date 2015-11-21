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
var SectionComponentListMixin = components.SectionComponentListMixin;



var ConceptStore = function(options) {

    this.model = new ConceptModel(options);
};

ConceptStore.prototype = {

    fetch: function() {
        return this.model.fetch();
    },

    getConceptName: function() {
        return this.model.get("name");
    },

    getSections: function() {
        return this.model.get("sections");
    },

    getSectionDataAt: function(position) {
        var data = this.model.attributes.sections[position].data;

        //clone the object so that the view is free is mutate the object. 
        return _.clone(data); 
    }
};

ConceptStore.prototype.constructor = ConceptStore;

var StudentConceptNameComponent = React.createClass({

    render: function() {

        var message = this.props.conceptStore.getConceptName();

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

        var sections = this.props.conceptStore.getSections();
        var options = {
            conceptStore: this.props.conceptStore
        }
        var components = this.getComponentList(sections, STUDENT_SECTION_COMPONENTS_BY_TYPE, options);

        return (
            <div> 
                <StudentConceptNameComponent conceptStore={this.props.conceptStore} />
                {components}
            </div>
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

