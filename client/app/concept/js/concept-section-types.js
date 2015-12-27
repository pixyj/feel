var _ = require("underscore");

var C = require("./components.jsx");

var SECTION_TYPES_AND_COMPONENTS = {

    COURSE_PRETEST: {
        type: 0,
        studentComponent: C.StudentPrereqQuizSection,
        creatorComponent: C.QuizSectionComponent,
        name: "Course Pretest",
        blankState: {
            quizzes: []
        }
    },

    PREREQ_QUIZ: {
        type: 1,
        studentComponent: C.StudentPrereqQuizSection,
        creatorComponent: C.QuizSectionComponent,
        name: "Prerequisite Quiz",
        blankState: {
            quizzes: []
        }
    },

    QUIZ: {
        type: 2,
        studentComponent: C.StudentQuizSection,
        creatorComponent: C.QuizSectionComponent,
        name: "Quiz Section",
        blankState: {
            quizzes: []
        }
    },

    CODE_QUIZ: {
        type: 3,
        studentComponent: C.StudentCodeQuizSectionComponent,
        creatorComponent: C.CodeQuizSectionComponent,
        name: "Code Quiz",
        blankState: {
            quizzes: []
        }
    },

    EXIT_QUIZ: {
        type: 4,
        studentComponent: C.StudentExitQuizSection,
        creatorComponent: C.QuizSectionComponent,
        name: "Exit Quiz",
        blankState: {
            quizzes: []
        }
    },
    
    MARKDOWN: {
        type: 5,
        studentComponent: C.StudentMarkdownSectionComponent,
        creatorComponent: C.MarkdownSectionComponent,
        name: "Markdown Section",
        blankState: {
            input: "",
            display: ""
        }
    },

    VIDEO: {
        type: 6,
        studentComponent: C.StudentVideoSectionComponent,
        creatorComponent: C.VideoSectionComponent,
        name: "Video",
        blankState: {
            url: ""
        }
    },
    
    VISUALIZATION: {
        type: 7,
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

    SECTIONS_SORTED_BY_TYPE: SECTIONS_SORTED_BY_TYPE 
};