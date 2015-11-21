var _ = require("underscore");

var C = require("./components.jsx");

var SECTION_TYPES_AND_COMPONENTS = {
    
    MARKDOWN: {
        type: 1,
        studentComponent: C.StudentMarkdownSectionComponent,
        creatorComponent: C.MarkdownSectionComponent,
        name: "Markdown Section",
        blankState: {
            input: "",
            display: ""
        }
    },

    QUIZ: {
        type: 2,
        studentComponent: null,
        creatorComponent: C.QuizSectionComponent,
        name: "Quiz Section",
        blankState: {
            quizzes: []
        }
    },
    
    VIDEO: {
        type: 3,
        studentComponent: C.StudentVideoSectionComponent,
        creatorComponent: C.VideoSectionComponent,
        name: "Video",
        blankState: {
            url: ""
        }
    },
    
    VISUALIZATION: {
        type: 4,
        studentComponent: C.VisualizationSectionComponent,
        creatorComponent: C.VisualizationSectionComponent,
        name: "Visualization",
        blankState: {

        }
    }
};

var CREATOR_SECTION_COMPONENTS_BY_TYPE = function() {

    var componentsByType = {};
    _.each(_.values(SECTION_TYPES_AND_COMPONENTS), function(c) {
        componentsByType[c.type] = c.creatorComponent;
    });

    return componentsByType;
}();

var STUDENT_SECTION_COMPONENTS_BY_TYPE = function() {

    var componentsByType = {};
    _.each(_.values(SECTION_TYPES_AND_COMPONENTS), function(c) {
        componentsByType[c.type] = c.studentComponent;
    });

    return componentsByType;
}();

var SECTIONS_SORTED_BY_TYPE = function() {
    var sections = [];
    _.each(_.values(SECTION_TYPES_AND_COMPONENTS), function(c) {
        sections.push(c);
    });

    return _.sortBy(sections, "type");
}();

module.exports = {
    SECTION_TYPES_AND_COMPONENTS: SECTION_TYPES_AND_COMPONENTS,
    CREATOR_SECTION_COMPONENTS_BY_TYPE: CREATOR_SECTION_COMPONENTS_BY_TYPE,
    STUDENT_SECTION_COMPONENTS_BY_TYPE: STUDENT_SECTION_COMPONENTS_BY_TYPE,
    SECTIONS_SORTED_BY_TYPE: SECTIONS_SORTED_BY_TYPE };