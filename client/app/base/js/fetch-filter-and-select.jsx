var React = require("lib").React;
var ListMixin = require("./list-mixin.jsx").ListMixin;
var LoadingCircle = require("./loading-circle.jsx").LoadingCircle;

var Backbone = require("lib").Backbone;

var ListItem = React.createClass({

    render: function() {
        var Component = this.props.ItemComponent;
        return (
            <div onClick={this.select} className="filter-and-select-item collection-item">
                <Component {...this.props.contentProps} />
            </div>
        );
    },

    select: function() {
        this.props.parent.select(this.props.contentProps);
    }
});


var FilterAndSelectMixin = {

    _buildItemProps: function(object, index) {
        return {
            ItemComponent: this.props.ListItemComponent,
            contentProps: object,
            parent: this
        }
    },

    render: function() {

        var components = this.createList({
            ComponentClass: ListItem,
            collection: this.state.filteredCollection,
            buildProps: this._buildItemProps
        });

        return (
            <div>
                <input type="text"  onChange={this.handleInputChange} 
                                    onKeyUp={this.handleInputChange} 
                                    value={this.state.inputValue}
                                    placeholder="Search" />

                <div className="collection">
                    {components}
                </div>
            </div>
        );
    },

    handleInputChange: function(evt) {

        var value = evt.target.value;
        this.setState({
            filteredCollection: this.props.filterCollection.call(this.props.parent, value),
            inputValue: value
        });
    }
};

var FilterAndSelectComponent = React.createClass({

    mixins: [ListMixin, FilterAndSelectMixin],

    getInitialState: function() {
        return {
            inputValue: "",
            filteredCollection: this.props.collection
        };
    },

    select: function(item) {
        this.props.parent.select(item);
    }

});


var FetchFilterAndSelectMixin = {

    getInitialState: function() {
        return {
            collection: [],
            isDataFetched: false
        }
    },

    componentDidMount: function() {
        this._collection = new Backbone.Collection();
        this._collection.url = this.props.url;
            
        var self = this;
        this._collection.once("sync", this._updateCollection, this);
        this._collection.fetch();
    },

    _updateCollection: function() {
        this.collection = this._collection.toJSON();
        this.setState({
            collection: this.collection,
            isDataFetched: true
        });
    },

    componentWillUnMount: function() {
        this._collection.off();
    },

    render: function() {

        var content;
        if(!this.state.isDataFetched) {
            content = <LoadingCircle />
        }
        else {
            content = <FilterAndSelectComponent 
                            collection={this.state.collection}
                            ListItemComponent={this.props.ListItemComponent} 
                            filterCollection={this.filterCollection}
                            parent={this} />
        }
        return (
            <div>
                {content}
            </div>
        );
    }
};


module.exports = {
    FilterAndSelectMixin: FilterAndSelectMixin,
    FetchFilterAndSelectMixin: FetchFilterAndSelectMixin
};