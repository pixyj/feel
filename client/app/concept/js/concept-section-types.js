var _ = require("underscore");

var C = require("./components");

var SECTION_TYPES_AND_COMPONENTS = {
    
    MARKDOWN: {
        type: 1,
        studentComponent: null,
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
        studentComponent: null,
        creatorComponent: C.VideoSectionComponent,
        name: "Video",
        blankState: {
            url: ""
        }
    },
    
    VISUALIZATION: {
        type: 4,
        studentComponent: null,
        creatorComponent: C.VisualizationSectionComponent,
        name: "Visualization",
        blankState: {

        }
    }
};

var SECTION_COMPONENTS_BY_TYPE = function() {

    var componentsByType = {};
    _.each(_.values(SECTION_TYPES_AND_COMPONENTS), function(c) {
        componentsByType[c.type] = c.creatorComponent;
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
    SECTION_COMPONENTS_BY_TYPE: SECTION_COMPONENTS_BY_TYPE,
    SECTIONS_SORTED_BY_TYPE: SECTIONS_SORTED_BY_TYPE
};