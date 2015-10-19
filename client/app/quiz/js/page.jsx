var React = require("react");
var ReactDOM = require("react-dom");

var creator = require("./quiz-creator-view.jsx");


module.exports = {
    render: creator.render,
    unmount: creator.unmount
}