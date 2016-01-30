var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");

var ListMixin = require("list-mixin.jsx").ListMixin;
var mdAndMathToHtml = require("md").mdAndMathToHtml;

var SearchBar = React.createClass({

    getInitialState: function() {
        return {
            query: "",
            hits: []
        };
    },

    render: function() {
        return (
            <div>
                <input type="text" 
                       placeholder="search" 
                       value={this.state.query}
                       onKeyUp={this.setQueryAndSearch} 
                       onChange={this.setQueryAndSearch} 
                       onBlur={this.onBlur} />
            </div>

        );
    },

    setQueryAndSearch: function(evt) {
        var query = evt.target.value;
        this.setState({
            query: query,
            hits: this.getQueryHits(query)
        });
        this.props.model.trigger("change:hits", this.state.hits);
        if(query.length > 2) {
            this.search(query);
        }
    },

    getQueryHits: function(query) {
        query = query.toLowerCase();
        return this.props.model.filterHits(query);
    },

    updateHits: function() {
        this.setState({
            hits: this.getQueryHits(this.state.query)
        });
        this.props.model.trigger("change:hits", this.state.hits);
    },

    search: function(query) {
        this.props.model.search(query, this.updateHits, this);
    },

    onBlur: function() {
        this.setState({
            query: "",
            hits: []
        });
        this.props.model.trigger("change:hits", []);
    }

});

var SearchHitItem = React.createClass({

    render: function() {
        var snippet = mdAndMathToHtml(this.props.snippet);
        var heading = this.getHeading();
        return (
            <div className="collection-item">
                <a href={this.props.url}>
                    <span className="search-index-name">{heading}:</span>
                    <div className="search-hit-snippet" 
                         dangerouslySetInnerHTML={{__html: snippet}} />
                </a>
            </div>
        );
    },

    getHeading: function() {
        if(this.props.indexType === "concept_names") {
            return this.props.displayName;
        }
        else if(this.props.indexType === "concept_text") {
            return "{0} @ {1}".format(this.props.displayName, this.props.name);
        }
        else if(this.props.indexType === "concept_quizzes") {
            return "{0} @ {1}".format(this.props.displayName, this.props.name);
        }
        // utils.assert(false);
        return "";
    }


});

var SearchHits = React.createClass({

    mixins: [ListMixin],

    getInitialState: function() {
        return {
            hits: [],
            isActive: false
        };
    },

    componentDidMount: function() {
        this.props.model.on("change:hits", this.updateHits, this);
    },

    componentWillUnmount: function() {
        this.props.model.off("change:hits", this.updateHits, this);
    },

    _buildProps: function(obj) {
        return obj;
    },

    render: function() {

        if(!this.state.hits.length) {
            return <div></div>
        }

        var list = this.createList({
            ComponentClass: SearchHitItem,
            collection: this.state.hits,
            buildProps: this._buildProps
        });

        return (
            <div id="search-hits" className="collection">
                {list}
            </div>
        );
    },

    updateHits: function(hits) {
        console.info("updateHits", hits);
        this.setState({
            hits: hits
        });
    }
});

var render = function(searchModel, elements) {
    ReactDOM.render(<SearchBar model={searchModel} />, elements.searchBar);
    ReactDOM.render(<SearchHits model={searchModel} />, elements.searchHits);
};

module.exports = {
    render: render
};
