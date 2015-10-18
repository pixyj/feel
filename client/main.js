var $ = require("jquery");
var Backbone = require("backbone");

var Quiz = require("./app/quiz/js/api");

var Router = Backbone.Router.extend({
    
    routes: {
        "creator/quiz": "createQuiz",
        "": "home"
    },

    createQuiz: function() {
        console.log(Quiz.yep);
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
