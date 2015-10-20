var $ = require("jquery");
window.jQuery = $;
window.$ = $;
var Backbone = require("backbone");
window.Backbone = Backbone;

var _ = require("underscore");

var Quiz = require("./app/quiz/js/api");

var Utils = require("./app/base/js/utils");
var md = require("./app/base/js/md");
var models = require("models");
var UserModel = models.UserModel;

require("csrf");

var Router = Backbone.Router.extend({

    initialize: function(options) {
        this.currentComponent = null;
        this.userModel = options.userModel;
    },
    
    routes: {
        "creator/quiz": "createQuiz",
        "creator/quiz/:quizId": "editQuiz",
        "": "home",
        "login": "gotoLogin"
    },

    authRequiredRoutes: ['creator'],

    gotoLogin: function() {
        window.location.href = "/admin";
    },

    createQuiz: function() {
        this.resetPage();
        Quiz.render(this.pageElement, {quizId: null});
        this.currentComponent = Quiz;
    },

    editQuiz: function(quizId) {
        this.resetPage();
        Quiz.render(this.pageElement, {quizId: quizId});
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
        var message = "Home page not designed";
        this.pageElement.innerHTML = message;

        this.currentComponent = this;
        
        var self = this;
        // window.setTimeout(function() {
        //     self.navigate("creator/quiz", {trigger: true});
        // }, 2000);
    },

    unmount: function() {
        this.pageElement.remove();
    },

    execute: function(callback, args, name) {
        if(this.isAuthRequired() && !this.userModel.isAuthenticated()) {
            this.gotoLogin();
            return false;
            //Backbone.history.navigate("login", {trigger: true});
            //return false;    
        }

        if(callback) {
            callback.apply(this, args);
        }
    },

    isAuthRequired: function() {
        var frag = Backbone.history.getFragment();
        var matched = _.filter(this.authRequiredRoutes, function(r) {
            return frag.indexOf(r) !== -1;
        });

        return matched.length > 0;
    }


});

var init = function() {

    var userModel = new UserModel();
    userModel.fetch().then(function() {
        console.log(userModel.toJSON());
        var router = new Router({userModel: userModel});
        Backbone.history.start({pushState: false});
    });

};

$(document).ready(init);


