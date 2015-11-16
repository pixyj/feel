var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");
var tags = require("tags.jsx");
var md = require("md");

var MarkdownAndPreviewMixin = require("markdown-and-preview.jsx").MarkdownAndPreviewAttrs;

var PreviewComponent = React.createClass({

    render: function() {
        
        return (
            <div className="row">
                <button className="btn btn-large waves-effect">Preview: See how the page appears to students </button>
            </div>
        );
    }   
});

var SectionHeadingComponent = React.createClass({

    render: function() {
        
        return (
            <h4> {this.props.sectionName} </h4>  
        );
    }
});

var ConceptNameSectionComponent = React.createClass({

    getInitialState: function() {
        return {
            conceptName: app.state.conceptName
        }
    },

    render: function() {
        var className = this.props.htmlClass;
        return (
            <div className="row concept-creator-section">
                <div className="col-xs-12">
                    <SectionHeadingComponent sectionName="Concept Name" />
                    <input  type="text" 
                            placeholder="Name the concept" 
                            value={this.state.conceptName}
                            onKeyUp={this.updateConceptName}
                            onChange={this.updateConceptName} />
                </div>
            </div>
        );
    },

    updateConceptName: function(evt) {
        var value = evt.target.value;
        app.state.conceptName = value;
        this.setState({
            conceptName: value
        });
    }

});

//Since React doesn't support overriding mixin methods, 
// we're using underscore to perform the same task. 
var MarkdownComponentMixin = _.extend(MarkdownAndPreviewMixin, {

    getInitialState: function() {
        return this.props.data.state;
    },

    onContentUpdated: function(state) {
        this.props.data.state = state;
    }

});

var MarkdownComponent = React.createClass(MarkdownComponentMixin);

var MarkdownSectionComponent = React.createClass({


    render: function() {
        return (
            <div className="row concept-creator-section">
                <SectionHeadingComponent sectionName="Markdown Section" />
                <MarkdownComponent data={this.props.data} />
            </div>
        );
    }
});

var VideoSectionComponent = React.createClass({

    getInitialState: function() {
        return this.props.data.state;
    },

    render: function() {

        return (
            <div className="row concept-creator-section">
                
                <SectionHeadingComponent sectionName="Video" />

                <input  type="url" 
                        placeholder="Enter URL here" 
                        value={this.state.url} 
                        onKeyUp={this.updateURL}
                        onChange={this.updateURL} /> 

                <iframe width="560" height="315" src={this.state.url} frameborder="0" allowfullscreen></iframe>

            </div>
        );
        
    },

    updateURL: function(evt) {
        var value = evt.target.value;
        this.props.data.state.url = value;
        this.setState({
            url: value
        });
    },
});

var SECTION_TYPES_AND_COMPONENTS = {
    
    MARKDOWN: {
        type: 1,
        component: MarkdownSectionComponent,
        name: "Markdown Section"
    },

    QUIZ: {
        type: 2,
        component: null,
        name: "Quiz Section"
    },
    
    VIDEO: {
        type: 3,
        component: VideoSectionComponent,
        name: "Video"
    },
    
    VISUALIZATION: {
        type: 4,
        component: null,
        name: "Visualization"
    }
};

var SECTION_COMPONENTS_BY_TYPE = function() {

    var componentsByType = {};
    _.each(_.values(SECTION_TYPES_AND_COMPONENTS), function(c) {
        componentsByType[c.type] = c.component;
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


var app = {};

app.state = {

    conceptName: "Matrix Multiplication",

    sections: [
        {
            type: SECTION_TYPES_AND_COMPONENTS.MARKDOWN.type,
            state: {
                input: "hi",
                display: "<p>hi</p>"
            }
        },
        {
            type: SECTION_TYPES_AND_COMPONENTS.VIDEO.type,
            state: {
                url: "https://www.youtube.com/embed/MCs5OvhV9S4"
            }
        }
    ],

};

window.app = app;

var AddSectionComponent = React.createClass({

    render: function() {

        var buttons = [];
        var sections = SECTIONS_SORTED_BY_TYPE;
        var length = SECTIONS_SORTED_BY_TYPE.length;
        for(var i = 0; i < length; i++) {
            var text = "Add " + sections[i].name;
            var button = <div className="col-md-3" key={i}> 
                            <button className="btn waves-effect">{text}</button> 
                         </div>
            buttons.push(button);
        }
        
        return (

            <div className="row concept-creator-add-section">
                {buttons}
            </div>
        );
    }

});

var PageComponent = React.createClass({

    getInitialState: function() {
        return app.state;
    },

    render: function() {

        var x = 1;

        var sections = this.state.sections;
        var length = this.state.sections.length;
        var components = [];
        for(var i = 0; i < length; i++) {
            var section = sections[i];
            var ComponentClass = SECTION_COMPONENTS_BY_TYPE[section.type];
            var component = <ComponentClass data={section} key={i} />
            components.push(component);
        }

        return (
            <div>
                <PreviewComponent />

                <ConceptNameSectionComponent />
                {components}
                <AddSectionComponent />
            </div>
        );
    }


});



var render = function(element) {
    ReactDOM.render(<PageComponent />, element);
};

var unmount = function(element) {
    ReactDOM.unmountComponentAtNode(element);
}

module.exports = {
    render: render,
    unmount: unmount
};