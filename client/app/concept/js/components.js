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




var SectionHeadingComponent = React.createClass({

    render: function() {
        
        return (
            <h4> {this.props.sectionName} </h4>  
        );
    }
});



//Since React doesn't support overriding mixin methods, 
// we're using underscore to perform the same task. 
var MarkdownComponentMixin = _.extend(MarkdownAndPreviewMixin, {

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

});

var MarkdownComponent = React.createClass(MarkdownComponentMixin);

var MarkdownSectionComponent = React.createClass({

    render: function() {
        return (
            <div className="row concept-creator-section">
                <SectionHeadingComponent sectionName="Markdown Section" />
                <MarkdownComponent position={this.props.position} />
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
            videoFrame = <iframe width="560" height="315" src={this.state.url} frameborder="0" allowfullscreen></iframe>
        }
        else {
            videoFrame = <h5>Enter the embed URL to see your video</h5>
        }

        return (
            <div className="row concept-creator-section">
                
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
        var view = matrixMultiply.render();
        this.refs.content.appendChild(view.$el[0]);
        view.render();
    },

    componentWillUnmount: function() {

    },

    render: function() {

        return (
            <div className="row concept-creator-section">
                
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
            <div className="row concept-creator-section concept-creator-quiz-section">

                <SectionHeadingComponent sectionName="Quiz Section" />
                <div className="collection">
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

        this.props.store.saveSectionDataAt({
            quizzes: quizzes
        }, this.props.position);
    }

});

module.exports = {
    SectionHeadingComponent: SectionHeadingComponent,
    MarkdownComponentMixin: MarkdownComponentMixin,
    MarkdownComponent: MarkdownComponent,
    MarkdownSectionComponent: MarkdownSectionComponent,
    VideoSectionComponent: VideoSectionComponent,
    VisualizationSectionComponent: VisualizationSectionComponent,
    QuizSectionComponent: QuizSectionComponent
}