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

    render: function() {
        var className = this.props.htmlClass;
        return (
            <div className="row concept-creator-section">
                <div className="col-xs-12">
                    <SectionHeadingComponent sectionName="Concept Name" />
                    <input type="text" placeholder="Name the concept" />
                </div>
            </div>
        );
    }

});


var MarkdownComponent = React.createClass({

    mixins: [MarkdownAndPreviewMixin],

});

var MarkdownSectionComponent = React.createClass({

    render: function() {
        return (
            <div className="row concept-creator-section">
                <SectionHeadingComponent sectionName="Markdown Section" />
                <MarkdownComponent />
            </div>
        );
    }
});

var VideoSectionComponent = React.createClass({

    render: function() {

        return (
            <div className="row concept-creator-section">
                <SectionHeadingComponent sectionName="Video" />
                <iframe width="560" height="315" src="https://www.youtube.com/embed/MCs5OvhV9S4" frameborder="0" allowfullscreen></iframe>
            </div>
        );
        
    }
});

var AddSectionComponent = React.createClass({

    SECTIONS: [
        "Markdown Section",
        "Quiz Section",
        "Video",
        "Visualization"
    ],

    SECTION_CLASSES: [

    ],

    render: function() {

        var buttons = [];
        var length = this.SECTIONS.length;
        for(var i = 0; i < length; i++) {
            var text = "Add " + this.SECTIONS[i];
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

    render: function() {

        return (
            <div>
                <PreviewComponent />

                <ConceptNameSectionComponent />
                <MarkdownSectionComponent/>

                <MarkdownSectionComponent />
                <VideoSectionComponent />
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