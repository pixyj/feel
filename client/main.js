var $ = require("jquery");
window.jQuery = $;
window.$ = $;
var Backbone = require("backbone");

var Quiz = require("./app/quiz/js/api");

var Utils = require("./app/base/js/utils");
var md = require("./app/base/js/md");

ok = md.mdAndMathToHtml("yes<math>sin(x) + cos(x)</math>");
console.log(ok);


var Router = Backbone.Router.extend({

    initialize: function() {
        this.pageElement = document.getElementById("page");
    },
    
    routes: {
        "creator/quiz": "createQuiz",
        "": "home"
    },

    createQuiz: function() {
        Quiz.render(this.pageElement);
    },

    home: function() {
        console.log("I'm going home");
        var self = this;
        var message = "Home page not designed. Navigating to quiz in 2 seconds";
        this.pageElement.innerHTML = message;
        window.setTimeout(function() {
            self.navigate("creator/quiz", {trigger: true});
        }, 2000);
    }


});

var init = function() {
    var router = new Router();
    Backbone.history.start({pushState: false});
};

$(document).ready(init);


