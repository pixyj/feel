var _ = require("lib")._;
var React = require("lib").React;

var TagSingleViewMixin = {

    render: function() {
        return (
            <div className="chip">
                <span> {this.props.name} </span>
                <i className="material-icons" onClick={this.removeTag} >close</i>
            </div>

        );
    },

    removeTag: function(evt) {
        this.props.parent.removeTag(this.props.name);
    }
};

var TagListViewMixin = {

    getInitialState: function() {
        return {
            inputValue: ""
        }
    },

    SINGLE_VIEW_MIXIN: TagSingleViewMixin,
    PROP_NAME: "name",

    render: function() {

        var SingleView = React.createClass(this.SINGLE_VIEW_MIXIN);

        var i;
        var length = this.props.store.tags.length;
        var rows = [];
        for(i = 0; i < length; i++) {
            var tag = this.props.store.tags[i];
            var name = tag[this.PROP_NAME];
            var view = <SingleView name={name} parent={this} key={name} />
            rows.push(view);
        }
        if(!length) {
            rows = <h5>No tags yet</h5>
        }

        return (
            <div>
                <div>
                    {rows}
                </div>
                <div className="input-field">
                    <input  type="text" 
                            onKeyUp={this.addTagIfReturnPressed} 
                            onChange={this.addTagIfReturnPressed} 
                            value={this.state.inputValue} />
                    <label>Add Tag </label>
                </div>
            </div>
        );
    },

    //check out todo in materialize.js
    addTagIfReturnPressed: function(evt) {
        if(evt.keyCode !== 13) {
            this.setState({
                inputValue: evt.target.value
            });
            return;
        }
        var value = evt.target.value.trim();
        var tag = {};
        tag[this.PROP_NAME] = value;
        var tags = _.clone(this.props.store.tags);
        tags.push(tag);

        this.setState({
            inputValue: ""
        });

        this.props.store.setState({
            tags: tags
        });
    },

    removeTag: function(name) {

        var tags = _.filter(this.props.store.tags, function(tag) {
            return tag[this.PROP_NAME] !== name
        }, this);

        this.props.store.setState({
            tags: _.clone(tags)
        });
    }

};

var TagListBaseView = React.createClass(TagListViewMixin);

module.exports = {
    TagSingleViewMixin: TagSingleViewMixin,
    TagListViewMixin: TagListViewMixin,
    TagListBaseView: TagListBaseView
};
