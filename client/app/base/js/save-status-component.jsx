var React = require("react");
var ReactDOM = require("react-dom");

var SaveStatusMixin = {

    getInitialState: function() {
        return {
            isSaved: true
        }
    },

    render: function() {
        var message = this.state.isSaved ? "Saved" : "Saving ...";

        var className = this.props.className || this.CLASSNAME || "save-status";

        return (
            <div>
                <span className={className}> {message} </span>
            </div>
        );
        
    },

    setIsSaved: function(isSaved) {
        this.setState({
            isSaved: isSaved
        });
    }

};

var SaveStatusComponent = React.createClass(SaveStatusMixin);

module.exports = {
    SaveStatusMixin: SaveStatusMixin,
    SaveStatusComponent: SaveStatusComponent
};