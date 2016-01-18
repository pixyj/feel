var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var ListMixin = require("list-mixin.jsx").ListMixin;
var Ago = require("ago.jsx").Ago;

/********************************************************************************
*   Store
*********************************************************************************/

var Store = Backbone.Collection.extend({

    url: function() {
        return '/api/v1/creators/concepts/';
    },

    parse: function(items) {
        _.each(items, function(concept) {
            concept.url = "/creator/concept/{0}/".format(concept.id);
        });
        return items;
    },

    cleanup: function() {
        this.off();
    }
});

/********************************************************************************
*   Components
*********************************************************************************/

var ConceptItem = React.createClass({

    render: function() {
        return (
            <div className="collection-item">
                <a href={this.props.url}> 
                    <h5> {this.props.name} </h5> 
                </a>
                <Ago time={this.props.createdAt} action="Created" />
            </div>
        );
    }
});

var Page = React.createClass({

    mixins: [ListMixin],

    _buildProps: function(item, index) {
        return item;
    },

    render: function() {
        var list = this.createList({
            ComponentClass: ConceptItem,
            collection: this.props.store.toJSON(),
            buildProps: this._buildProps
        });

        return (
            <div className="collection">
                {list}
            </div>
        );
    }
});

/********************************************************************************
*   API
*********************************************************************************/

var app = {

};

var render = function(options, element) {
    options = options || {};

    app.store = new Store(options);
    var onReady = function() {
        ReactDOM.render(<Page store={app.store} />, element);        
    };

    app.store.fetch().then(onReady);

};

var unmount = function(element) {
    app.store.cleanup();
    ReactDOM.unmountComponentAtNode(element);
}

module.exports = {
    render: render,
    unmount: unmount
};