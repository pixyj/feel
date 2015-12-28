var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var RemoveItemMixin = {


    render: function() {

        var className = this.props.className || this.CLASSNAME || "remove-item";

        return (
                <span className={className} onClick={this.removeItem} > ✖ </span>
        );
        
    }

};

var RemoveItemComponent = React.createClass(RemoveItemMixin);

module.exports = {
    RemoveItemMixin: RemoveItemMixin,
    RemoveItemComponent: RemoveItemComponent
};