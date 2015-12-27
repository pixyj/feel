var React = require("react");
var utils = require("utils");

var Ago = React.createClass({

    render: function() {
        var time = utils.prettyDate(utils.getUTCDate(new Date(this.props.time)));
        var message = "{0} {1}".format(this.props.action|| "", time);
        return (
            <p className="created-at">{message}</p>
        );
    }
});

module.exports = {
    Ago: Ago
};