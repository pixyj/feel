var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;


//Todo -> Merge with save-status-component.jsx
var SaveStatus = React.createClass({

    getInitialState: function() {
        return {
            isSaved: this.props.store.isSaved()
        };
    },

    componentDidMount: function() {
        this.props.store.on("change:isSaved", this.updateState, this);
    },

    updateState: function() {
        this.setState(this.getInitialState());
    },

    render: function() {
        var className = this.props.className || "";
        var display = this.state.isSaved ? "Saved" : "Saving ...";

        return (
                <span className={className}> {display} </span>
        );
        
    }

});


module.exports = {
    SaveStatus: SaveStatus
};