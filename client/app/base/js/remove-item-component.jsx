var React = require("react");
var ReactDOM = require("react-dom");

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