var $ = require("jquery");
window.jQuery = $;
window.$ = $;
var Backbone = require("backbone");
window.Backbone = Backbone;

var Quiz = require("./app/quiz/js/api");

var Utils = require("./app/base/js/utils");
var md = require("./app/base/js/md");

ok = md.mdAndMathToHtml("yes<math>sin(x) + cos(x)</math>");
console.log(ok);


var Router = Backbone.Router.extend({

    initialize: function() {
        this.currentComponent = null;
    },
    
    routes: {
        "creator/quiz": "createQuiz",
        "": "home"
    },

    createQuiz: function() {
        this.resetPage();
        Quiz.render(this.pageElement);
        this.currentComponent = Quiz;
    },

    resetPage: function() {
        if(this.currentComponent !== null) {
            this.currentComponent.unmount(this.pageElement);
            this.pageElement.remove();
        }
        var page = document.createElement("div");
        page.setAttribute("id", "page");
        document.body.appendChild(page);
        this.pageElement = page;
    },

    home: function() {

        this.resetPage();
        var message = "Home page not designed. Navigating to quiz in 2 seconds";
        this.pageElement.innerHTML = message;

        this.currentComponent = this;
        
        var self = this;
        // window.setTimeout(function() {
        //     self.navigate("creator/quiz", {trigger: true});
        // }, 2000);
    },

    unmount: function() {
        this.pageElement.remove();
    }


});

var init = function() {
    var router = new Router();
    Backbone.history.start({pushState: false});
};

$(document).ready(init);


