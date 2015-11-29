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

var PageModel = require("./models").StudentConceptPageModel;

var components = require("./components.jsx");
var SectionHeadingComponent = components.SectionHeadingComponent;
var SectionComponentListMixin = components.SectionComponentListMixin;



var PageStore = function(options) {

    this.model = new PageModel(options);
};

PageStore.prototype = {

    fetch: function() {
        return this.model.fetch();
    },

    toJSON: function() {
        return this.model.toJSON()
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
            page: this.props.page
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

var renderPage = function(page, element) {
    ReactDOM.render(<PageComponent page={page} />, element);
};

var app = {};


var render = function(options, element) {

    app.pageStore = new PageStore(options);

    app.pageStore.fetch().then(function() {
        var page = app.pageStore.toJSON();
        renderPage(page, element);
    });
};

var unmount = function() {

};

module.exports = {
    render: render, 
    unmount: unmount
}

