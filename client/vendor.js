window.$ = require("jquery");
window.jQuery = window.$;

window._ = require("underscore");
window.Backbone = require("backbone");

var React = require("react");
window.React = React;
window.ReactDOM = require("react-dom");

window.commonmark = require("./app/vendor/commonmark/commonmark");

require("./app/vendor/ace/ace");
require("./app/vendor/ace/mode-python");
require("./app/vendor/ace/theme-chrome");
require("./app/vendor/materialize/js/bin/materialize");
require("./app/vendor/katex/katex.min.js");