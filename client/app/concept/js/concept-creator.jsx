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
var SECTION_COMPONENTS_BY_TYPE = conceptSectionTypes.SECTION_COMPONENTS_BY_TYPE;
var SECTIONS_SORTED_BY_TYPE = conceptSectionTypes.SECTIONS_SORTED_BY_TYPE;

var ConceptModel = require("./models").ConceptModel;

var components = require("./components");
var SectionHeadingComponent = components.SectionHeadingComponent;

var Store = function(options) {
    this.options = options;
    this.model = new ConceptModel(options);
    if(!options.uuid) {
        this._listenToSaveEvent();
    }
    else {
        this.isRouteSet = true;
        this.fetch();
    }
};

Store.prototype = {

    getConceptName: function() {
        return this.model.get("name");
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

    fetch: function() {
        this.model.once("sync", this._afterFirstSync, this);
        this.model.fetch();
    },

    toJSON: function() {
        return this.model.toJSON();
    },

    cleanup: function() {
        this.model.off("sync");
    },

    _listenToSaveEvent: function() {
        this.model.on("sync", this._onSaved, this);
    },

    _afterFirstSync: function() {
        this._listenToSaveEvent();
        this.trigger("ready");
        this._onSaved();
        this.options.onReady();
    },

    _onSaved: function() {
        this.setRoute()
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
        this.setState({
            conceptName: value
        });
        this.props.store.saveConceptName(value);
    }

});

var AddSectionComponent = React.createClass({

    render: function() {

        var buttons = [];
        var sections = SECTIONS_SORTED_BY_TYPE;
        var length = SECTIONS_SORTED_BY_TYPE.length;
        for(var i = 0; i < length; i++) {
            var text = "Add " + sections[i].name;
            var button = <div className="col-md-3" key={i} > 
                            <button 
                                className="btn waves-effect"
                                data-section-type={sections[i].type}
                                onClick={this.addSection}>{text}
                            </button> 
                         </div>
            buttons.push(button);
        }
        
        return (

            <div className="row concept-creator-add-section">
                {buttons}
            </div>
        );
    },

    addSection: function(evt) {
        console.log(evt);
        var sectionType = parseInt(evt.target.getAttribute("data-section-type"));
        var section = SECTIONS_SORTED_BY_TYPE[sectionType-1];
        var blankState = _.clone(section.blankState);
        var sectionAttrs = {
            type: sectionType,
            data: blankState
        };
        this.props.parent.addSection(sectionAttrs);
    }

});

var PreviewComponent = React.createClass({

    render: function() {
        
        return (
            <div className="row" id="concept-creator-preview-section">

                <div className="col-md-3">
                </div>

                <div className="col-md-6">
                    <button className="btn btn-large waves-effect">Preview: See how the page appears to students </button>
                </div>

                <div className="col-md-3">
                </div>
            </div>
        );
    }   
});

var PageComponent = React.createClass({

    getInitialState: function() {
        return app.store.toJSON();
    },

    render: function() {

        var components = [];
        var sections = app.store.getSections();
        var length = sections.length;

        for(var i = 0; i < length; i++) {
            var section = sections[i];
            var ComponentClass = SECTION_COMPONENTS_BY_TYPE[section.type];
            var component = <ComponentClass 
                                key={i} 
                                position={i} 
                                parent={this} 
                                store={app.store} />
            components.push(component);
        }

        return (
            <div>
                <ConceptNameSectionComponent store={app.store} />
                {components}
                <AddSectionComponent parent={this} />

                <PreviewComponent />
            </div>
        );
    },

    addSection: function(section) {
        app.store.addSection(section);
        this.setState(app.store.toJSON());
    }

});

var app = {

};

var render = function(options, element) {
    options = options || {};

    var onReady = function() {
        ReactDOM.render(<PageComponent />, element);        
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