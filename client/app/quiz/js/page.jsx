var React = require("react");
var ReactDOM = require("react-dom");

var creator = require("./quiz-creator-view.jsx");

var render = function(element) {
    creator.render(element);
};


module.exports = {
    render: render
}