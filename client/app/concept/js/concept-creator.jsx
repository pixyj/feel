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
var CREATOR_SECTION_COMPONENTS_BY_TYPE = conceptSectionTypes.CREATOR_SECTION_COMPONENTS_BY_TYPE;
var SECTIONS_SORTED_BY_TYPE = conceptSectionTypes.SECTIONS_SORTED_BY_TYPE;

var ConceptModel = require("./models").ConceptModel;

var components = require("./components.jsx");
var SectionHeadingComponent = components.SectionHeadingComponent;
var SectionComponentListMixin = components.SectionComponentListMixin;
var SectionSaveStatusComponent = components.SectionSaveStatusComponent;


var Store = function(options) {
    this.options = options;
    this.model = new ConceptModel(options);
    if(!options.uuid) {
        this._listenToFirstSyncEvent();
    }
    else {
        this.isRouteSet = true;
        this.fetch();
    }
    this._listenToSaveStatusChanged();
};

Store.prototype = {

    getConceptName: function() {
        return this.model.get("name");
    },

    getUUID: function() {
        return this.model.get("uuid");
    },

    saveConceptName: function(name) {
        this.model.attributes.name = name;
        this.model.save();
    },

    getSections: function() {
        return this.model.get("sections");
    },

    getSectionAt: function(position) {
        return this.getSections()[position];
    },

    saveSectionDataAt: function(data, position) {
        this.model.attributes.sections[position].data = data;
        this.model.save();
    },

    addSection: function(section) {
        this.model.attributes.sections.push(section);
        this.model.save();
    },

    removeSectionAt: function(position) {
        var sections = this.model.attributes.sections;
        sections.splice(position, 1);
        this.model.save();
        this.trigger("remove:section");
    },

    fetch: function() {
        this.model.once("sync", this._onFirstSync, this);
        this.model.fetch();
    },

    toJSON: function() {
        return this.model.toJSON();
    },

    cleanup: function() {
        this.model.off("sync");
    },

    _listenToFirstSyncEvent: function() {
        this.model.once("sync", this._onFirstSync, this);
    },

    _onFirstSync: function() {
        this.trigger("ready");
        this.setRoute();
        this.options.onReady();
    },

    _listenToSaveStatusChanged: function() {
        this.model.on("change:isSaved", this._onSaveStatusChanged, this);
    },

    _onSaveStatusChanged: function(status) {
        this.trigger("change:isSaved", status);
    },

    isSaved: function() {
        return this.model.isSaved();
    },

    setRoute: function() {
        if(this.isRouteSet) {
            return;
        }
        var uuid = this.model.attributes.uuid;
        var fragment = Backbone.history.getFragment();
        var fragmentNew = "{0}/{1}/".format(fragment, uuid);
        Backbone.history.navigate(fragmentNew, {trigger: false});
        this.isRouteSet = true;
    }

};

_.extend(Store.prototype, Backbone.Events);
Store.prototype.constructor = Store;


var ConceptNameSectionComponent = React.createClass({

    getInitialState: function() {
        return {
            conceptName: this.props.store.getConceptName()
        }
    },

    render: function() {
        var className = this.props.htmlClass;
        return (
            <div className="row concept-creator-section card">
                <SectionSaveStatusComponent store={this.props.store} />
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
        this.setState({
            conceptName: value
        });
        this.props.store.saveConceptName(value);
    }

});

var RowComponent = React.createClass({

    render: function() {
        var columns = this.props.columns;
        var length = columns.length;

        var components = [];
        for(var i = 0; i < length; i++) {
            components.push(columns[i]);
        }

        var className = "row " + this.props.className;

        return (
            <div className={className}>
                {components}
            </div>
        );
    }
});

var AddSectionButtonComponent = React.createClass({

    render: function() {
        var section = this.props.section;
        var text = "Add " + section.name;
        return (
            <div className="col-md-4" key={this.props.key} > 
                <button 
                    className="btn waves-effect"
                    data-section-type={section.type}
                    onClick={this.handleClick}>{text}
                </button> 
            </div>
        );
    },

    handleClick: function(evt) {
        this.props.parent.addSection(evt);
    }
});

var AddSectionComponent = React.createClass({

    render: function() {

        var sections = SECTIONS_SORTED_BY_TYPE;
        var length = SECTIONS_SORTED_BY_TYPE.length;

        var rowSections;
        var buttonsPerRow = 3;
        var rows = [];
        for(var i = 0; i < parseInt(length / buttonsPerRow); i++) {
            rowSections = sections.slice(i*buttonsPerRow, (i+1)*buttonsPerRow);
            var rowLength = rowSections.length;
            var buttons = [];
            for(var j = 0; j < rowLength; j++) {
                var button = <AddSectionButtonComponent 
                            key={j} 
                            section={rowSections[j]} 
                            parent={this} />;
                buttons.push(button);
            }
            var row = <RowComponent key={i} columns={buttons} className="concept-creator-add-section-row"/>
            rows.push(row);
        }
        
        return (

            <div className="row concept-creator-add-section">
                {rows}
            </div>
        );
    },

    addSection: function(evt) {
        console.log(evt);
        var sectionType = parseInt(evt.target.getAttribute("data-section-type"));
        var section = SECTIONS_SORTED_BY_TYPE[sectionType];
        var blankState = _.clone(section.blankState);
        var sectionAttrs = {
            type: sectionType,
            data: blankState,
            name: section.name
        };
        this.props.parent.addSection(sectionAttrs);
    }

});

var PreviewComponent = React.createClass({

    render: function() {

        var studentURL = "#/concept/" + this.props.store.getUUID() + "/";
        
        return (
            <div className="row" id="concept-creator-preview-section">

                <div className="col-md-3">
                </div>

                <div className="col-md-6">
                    <a href={studentURL}>
                        <button className="btn waves-effect blue">
                            Preview: See how the page appears to students 
                        </button>
                    </a>
                </div>

                <div className="col-md-3">
                </div>
            </div>
        );
    }   
});

var PageComponent = React.createClass({

    mixins: [SectionComponentListMixin],

    getInitialState: function() {
        return this.props.store.toJSON();
    },

    componentDidMount: function() {
        this.props.store.on("remove:section", this.updateState, this);
    },

    componentWillUnmount: function() {
        this.props.store.off("remove:section", this.updateState);
    },

    render: function() {

        var components = [];
        var sections = this.props.store.getSections();

        var componentProps = {
            store: app.store
        };
        var components = this.getComponentList(sections, CREATOR_SECTION_COMPONENTS_BY_TYPE, componentProps) 

        return (
            <div>
                <ConceptNameSectionComponent store={app.store} />
                {components}
                <AddSectionComponent parent={this} />

                <PreviewComponent store={app.store} />
            </div>
        );
    },

    addSection: function(section) {
        this.props.store.addSection(section);
        this.setState(this.props.store.toJSON());
    },

    updateState: function() {
        this.setState(this.props.store.toJSON());
    }

});

var app = {

};

var render = function(options, element) {
    options = options || {};

    var onReady = function() {
        ReactDOM.render(<PageComponent store={app.store} />, element);        
    };
    options.onReady = onReady;

    app.store = new Store(options, element);

    if(!options.uuid) {
        onReady();
    }


};

var unmount = function(element) {
    app.store.cleanup();
    ReactDOM.unmountComponentAtNode(element);
}

module.exports = {
    render: render,
    unmount: unmount
};
