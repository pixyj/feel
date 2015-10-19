var $ = require("jquery");
var Backbone = require("backbone");

var Quiz = require("./app/quiz/js/api");

var Utils = require("./app/base/js/utils");
var md = require("./app/base/js/md");

ok = md.mdAndMathToHtml("yes<math>sin(x) + cos(x)</math>");
console.log(ok);


var Router = Backbone.Router.extend({
    
    routes: {
        "creator/quiz": "createQuiz",
        "": "home"
    },

    createQuiz: function() {
        Quiz.render(document.getElementById("page"));
    },

    home: function() {
        console.log("I'm going home");
        var self = this;
        window.setTimeout(function() {
            self.navigate("creator/quiz", {trigger: true});
        }, 500);
    }


});

var init = function() {
    var router = new Router();
    Backbone.history.start({pushState: false});
}

init();
window.Backbone = Backbone;
