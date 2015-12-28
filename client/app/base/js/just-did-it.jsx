var React = require("react");

var JustDidIt = React.createClass({

    render: function() {
       
        return (
            <div className={this.props.className || ""}>
                <span className="just-did-it">✓</span>
            </div>
        );
    }

});

module.exports = {
    JustDidIt: JustDidIt
};