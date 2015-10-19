var React = require("react");
var ReactDOM = require("react-dom");

var Hello = React.createClass({

    render: function() {
        return (
            <h4> Hi </h4>
        );
    }
});

var render = function(element) {

    ReactDOM.render(
        <Hello />,
        element
    );
};


module.exports = {
    render: render
}