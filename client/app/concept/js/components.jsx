var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");
var tags = require("tags.jsx");
var md = require("md");
var MarkdownAndPreview = require("markdown-and-preview.jsx");
MarkdownAndPreviewMixin = MarkdownAndPreview.MarkdownAndPreviewAttrs;
MarkdownDisplayMixin = MarkdownAndPreview.MarkdownDisplayMixin;
MarkdownDisplayComponent = MarkdownAndPreview.MarkdownDisplayComponent;

//var visualize = require("./../../matrixviz/js/api");
//var matrixMultiply = visualize.matrixMultiply;

var QuizList = require("./../../quiz/js/quiz-list.jsx");
var QuizFilterComponent = QuizList.QuizFilterComponent;
var QuizSnippetComponent = QuizList.QuizSnippetComponent;

var QuizCreator = require("./../../quiz/js/quiz-creator-view.jsx");
var QuizCreatorModalComponent = QuizCreator.QuizCreatorModalComponent;

var StudentQuizComponents = require("./../../quiz/js/quiz-student-view.jsx");

var SaveStatusMixin = require("save-status-component.jsx").SaveStatusMixin;
var RemoveItemComponent = require("remove-item-component.jsx").RemoveItemComponent;

var RemoveItemMixin = require("remove-item-component.jsx").RemoveItemMixin;

var CodeQuizSectionComponent = require("./../../code-quiz/js/creator.jsx").ConceptSectionComponent;
var StudentCodeQuizSectionComponent = require("./../../code-quiz/js/student.jsx").StudentCodeQuizSectionComponent;

var SectionRemoveItemComponent = React.createClass({
    
    mixins: [RemoveItemMixin],

    removeItem: function() {
        this.props.store.removeSectionAt(this.props.position);
    }

})

var SectionSaveStatusComponent = React.createClass({

    mixins: [SaveStatusMixin],

    CLASSNAME: "concept-save-status",

    componentDidMount: function() {
        this.props.store.on("change:isSaved", this.onSaveStatusChanged, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("change:isSaved", this.onSaveStatusChanged);
    },

    onSaveStatusChanged: function(isSaved) {
        this.setIsSaved(isSaved);
    }

});


var SectionHeadingComponent = React.createClass({

    render: function() {
        
        return (
            <h4> {this.props.sectionName} </h4>  
        );
    }
});



//Since React doesn't support overriding mixin methods, 
// we're using underscore to perform the same task. 
var MarkdownComponentMixin = utils.inherit({

    getInitialState: function() {
        var section = this.props.store.getSectionAt(this.props.position);
        var input = section.data.input;
        return {
            input: input,
            display: md.mdAndMathToHtml(input)
        }
    },

    onContentUpdated: function(state) {
        var data = {
            input: state.input
        };
        this.props.store.saveSectionDataAt(data, this.props.position);
    }

}, MarkdownAndPreviewMixin);

var MarkdownComponent = React.createClass(MarkdownComponentMixin);

var MarkdownSectionComponent = React.createClass({

    render: function() {

        return (
            <div className="row concept-creator-section card">
                <SectionSaveStatusComponent store={this.props.store} />
                <SectionRemoveItemComponent position={this.props.position} store={this.props.store} />
                <SectionHeadingComponent sectionName="Markdown Section" />
                <MarkdownComponent position={this.props.position} store={this.props.store} />
            </div>
        );
    }
});

var GetSectionDataMixin = {

    getSectionData: function(store) {
        return store.getSectionDataAt(this.props.position);
    }
}

var StudentMarkdownSectionComponent = React.createClass({


    render: function() {
        var input = this.props.section.data.input;
        var display = md.mdAndMathToHtml(input);
        return (
            <div className="concept-student-section card">
                <MarkdownDisplayComponent display={display} />
            </div>
        );
    }
});


var VideoFrameComponent = React.createClass({

    render: function() {
        return (
            <iframe width="560" height="315" src={this.props.url} frameborder="0" allowfullscreen></iframe>
        );
    }

});

var StudentVideoSectionComponent = React.createClass({


    render: function() {
        var url = this.props.section.data.url;

        return (
            <div className="concept-student-section card">
                <VideoFrameComponent url={url} />
            </div>
        );
    }
});


var VideoSectionComponent = React.createClass({

    getInitialState: function() {
        return this.props.store.getSectionAt(this.props.position).data;
    },

    render: function() {

        var videoFrame;
        if(this.state.url) {
            videoFrame = <VideoFrameComponent url={this.state.url} />
        }
        else {
            videoFrame = <h5>Enter the embed URL to see your video</h5>
        }

        return (
            <div className="row concept-creator-section card">
                <SectionSaveStatusComponent store={this.props.store} />
                <SectionRemoveItemComponent position={this.props.position} store={this.props.store} />
                <SectionHeadingComponent sectionName="Video" />

                <input  type="url" 
                        placeholder="Enter URL here" 
                        value={this.state.url} 
                        onKeyUp={this.updateURL}
                        onChange={this.updateURL} /> 

                {videoFrame}
                
            </div>
        );
        
    },

    updateURL: function(evt) {
        var value = evt.target.value;
        var newState = _.clone(this.state);
        newState.url = value;
        this.setState(newState);
        this.props.store.saveSectionDataAt(newState, this.props.position);

    }
});

var VisualizationSectionComponent = React.createClass({

    componentDidMount: function() {
        //var view = matrixMultiply.render();
        //$(this.refs.content.getDOMNode()).append(view.$el);
        //view.render();
    },

    componentWillUnmount: function() {

    },

    render: function() {

        return (
            <div className="row concept-creator-section card">
                <SectionSaveStatusComponent store={this.props.store} />
                <SectionRemoveItemComponent position={this.props.position} store={this.props.store} />
                <SectionHeadingComponent sectionName="Visualization" />
                <div ref="content"> </div>
                
            </div>
        );

    }
});

var QuizSectionComponent = React.createClass({

    getInitialState: function() {
        var attrs = this.props.store.getSectionAt(this.props.position).data;
        return _.extend(attrs, {
            showQuizFilter: false,
            showQuizCreator: false
        });
    },

    componentDidMount: function() {
        
    },

    render: function() {
        var quizzes = this.state.quizzes;
        var length = quizzes.length;

        var components = []; 
        if(length) {
            for(var i = 0; i < length; i++) {
                var quiz = quizzes[i];

                var view =  <QuizSnippetComponent 
                                key={i}
                                quiz={quiz} /> 

                components.push(view);
            }

        }
        else {
            components = <h5>You have not added any quizzes yet</h5>            
        }

        var quizFilterComponent; 
        if(this.state.showQuizFilter) {
            quizFilterComponent = <QuizFilterComponent ref="quizFilter" parent={this} />
        }
        else {
            quizFilterComponent = <div></div>
        }

        var quizCreatorComponent; 
        if(this.state.showQuizCreator) {
            quizCreatorComponent = <QuizCreatorModalComponent ref="quizCreator" parent={this} />
        }
        else {
            quizCreatorComponent = <div></div>
        }

        return (
            <div className="row concept-creator-section concept-creator-quiz-section card">
                <SectionSaveStatusComponent store={this.props.store} />
                <SectionRemoveItemComponent position={this.props.position} store={this.props.store} />
                <SectionHeadingComponent sectionName={this.props.section.name} />
                <div className="collection quiz-section-selected-collection">
                    {components}
                </div>

                {quizFilterComponent}
                {quizCreatorComponent}

                <div className="row">
                    <div className="col-md-4">
                        <button className="btn btn-large waves-effect" 
                                onClick={this.showQuizFilter}>
                                Add Existing Quiz
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-large waves-effect" 
                                onClick={this.showQuizCreator}>
                                Create Quiz
                        </button>
                    </div>

                </div>

            </div>
        );
    },

    showQuizFilter: function() {
        this.setState({
            showQuizFilter: true
        });
    },

    removeQuizFilter: function() {
        this.setState({
            showQuizFilter: false
        });
    },

    showQuizCreator: function() {
        this.setState({
            showQuizCreator: true
        });
    },

    removeQuizCreator: function() {
        this.setState({
            showQuizCreator: false
        });
    },

    selectQuiz: function(quiz) {
        
        var quizzes = _.clone(this.state.quizzes);
        quizzes.push(quiz);
        var uniqueQuizzes = _.uniq(quizzes);

        this.setState({
            quizzes: uniqueQuizzes,
            showQuizFilter: false
        });

        var quizIds = _.map(uniqueQuizzes, function(q) {
            return q.id;
        });

        this.props.store.saveSectionDataAt({
            quizIds: quizIds
        }, this.props.position);
    }

});


var SectionComponentListMixin = {

    getComponentList: function(sections, sectionComponentsByType, options) {

        var components = [];
        
        var length = sections.length;

        for(var i = 0; i < length; i++) {
            var section = sections[i];
            var ComponentClass = sectionComponentsByType[section.type];
            var component = <ComponentClass 
                                key={i} 
                                position={i} 
                                parent={this} 
                                {...options} 
                                section={section} />
            components.push(component);
        }
        return components;
    }
};


module.exports = {
    SectionSaveStatusComponent: SectionSaveStatusComponent,
    SectionHeadingComponent: SectionHeadingComponent,
    SectionComponentListMixin: SectionComponentListMixin,

    MarkdownComponentMixin: MarkdownComponentMixin,
    MarkdownSectionComponent: MarkdownSectionComponent,
    
    VideoSectionComponent: VideoSectionComponent,
    VisualizationSectionComponent: VisualizationSectionComponent,
    QuizSectionComponent: QuizSectionComponent,
    CodeQuizSectionComponent: CodeQuizSectionComponent,

    StudentPrereqQuizSection: StudentQuizComponents.StudentPrereqQuizSection,
    StudentQuizSection: StudentQuizComponents.StudentQuizSection,
    StudentExitQuizSection: StudentQuizComponents.StudentExitQuizSection,
    StudentMarkdownSectionComponent: StudentMarkdownSectionComponent,
    StudentVideoSectionComponent: StudentVideoSectionComponent,
    StudentCodeQuizSectionComponent: StudentCodeQuizSectionComponent
};