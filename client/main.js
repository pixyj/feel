var $ = require("jquery");
window.jQuery = $;
window.$ = $;
var Backbone = require("backbone");
window.Backbone = Backbone;


var _ = require("underscore");
window._ = _;

var Quiz = require("./app/quiz/js/api");

var Utils = require("./app/base/js/utils");
var md = require("./app/base/js/md");
var models = require("models");
var UserModel = models.UserModel;

var MatrixViz = require("./app/matrixviz/js/visualize");

var Concept = require("./app/concept/js/api");

var Course = require("./app/course/js/api");

require("csrf");


var Router = Backbone.Router.extend({

    initialize: function(options) {
        this.currentComponent = null;
        this.userModel = options.userModel;
    },
    
    routes: {
        "creator/concept": "createConcept",
        "creator/concept/:id/": "editConcept",
        "creator/course": "createCourse",
        "concept/:id/": "learnConcept",
        "creator/quiz": "createQuiz",
        "creator/quiz/:id": "editQuiz",
        "": "matrixviz",
        "login": "gotoLogin",
        "matrixviz": "matrixviz",
    },

    learnConcept: function(id) {
        this.resetPage();
        Concept.Student.render({id: id}, this.pageElement);
        this.currentComponent = Concept.Student;
    },

    createConcept: function() {
        this.resetPage();
        Concept.Creator.render({id: null}, this.pageElement);
        this.currentComponent = Concept.Creator;
    },

    editConcept: function(id) {
        this.resetPage();
        Concept.Creator.render({id: id}, this.pageElement);
        this.currentComponent = Concept.Creator;
    },

    createCourse: function() {
        this.resetPage();
        Course.Creator.render({}, this.pageElement);
        this.currentComponent = Course.Creator;
    },
    
    matrixviz: function() {
        MatrixViz.render();
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

    editQuiz: function(id) {
        this.resetPage();
        Quiz.render(this.pageElement, {id: id});
        this.currentComponent = Quiz;
    },

    resetPage: function() {
        if(this.currentComponent !== null) {
            this.currentComponent.unmount(this.pageElement);
            this.pageElement.remove();
        }
        var page = document.createElement("div");
        page.setAttribute("id", "page-content");
        page.setAttribute("class", "container");

        var pageFull = document.getElementById("page-full");
        pageFull.appendChild(page);
        this.pageElement = page;
    },

    home: function() {

        this.resetPage();
        var message = "Home page not designed";
        this.pageElement.innerHTML = message;

        this.currentComponent = this;
        
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
        var router = new Router({userModel: userModel});
        Backbone.history.start({pushState: false});
        console.log(userModel.toJSON());

    });

};

$(document).ready(init);


