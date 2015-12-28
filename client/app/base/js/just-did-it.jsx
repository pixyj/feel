var React = require("lib").React;

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