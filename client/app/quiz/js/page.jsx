var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var creator = require("./quiz-creator-view.jsx");


module.exports = {
    render: creator.render,
    unmount: creator.unmount
}