var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");
var ListMixin = require("list-mixin.jsx").ListMixin;

var md = require("md");
var MarkdownDisplayComponent = require("markdown-and-preview.jsx").MarkdownDisplayComponent;


// This is a module used to visualize and review mardkown content from all concepts. 

var Collection = Backbone.Collection.extend({

    url: function() {
        return "/api/v1/creators/markdown-sections/";
    },

    cleanup: function() {
        this.off();
    }

});

var SectionItem = React.createClass({

    render: function() {
        var html = md.mdAndMathToHtml(this.props.data.input);
        var url = "/creator/concept/{0}/".format(this.props.conceptId);
        return (
            <div className="card">
                <MarkdownDisplayComponent display={html} />
                <a href={url}>Edit </a>
            </div>
        );
    }
})


var PageComponent = React.createClass({

    mixins: [ListMixin],

    _buildProps: function(obj) {
        return obj;
    },

    render: function() {

        var list = this.createList({
            ComponentClass: SectionItem,
            collection: this.props.sections,
            buildProps: this._buildProps
        });
        
        return (
            <div className="collection">
                {list}
            </div>
        );
    }
});

var app = {

};

var render = function(options, element) {

    var store = new Collection();
    store.fetch().then(function() {
        ReactDOM.render(<PageComponent sections={store.toJSON()} />, element);
    });
    app.store = store;
    app.element = element;

};

var unmount = function() {
    app.store.cleanup();
    ReactDOM.unmountComponentAtNode(app.element);
};

module.exports = {
    render: render,
    unmount: unmount
};