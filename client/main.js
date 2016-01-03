var $ = require("lib").$;
var Backbone = require("lib").Backbone;
var _ = require("lib")._;

var Utils = require("./app/base/js/utils");
var md = require("./app/base/js/md");
var models = require("models");
var UserModel = models.UserModel;

var UserStatus = require("./app/user/js/user-status.jsx");
var ProgressBar = require("top-progress-bar");

var Quiz = require("./app/quiz/js/api");
var Concept = require("./app/concept/js/api");
var Course = require("./app/course/js/api");
var CodeQuiz = require("./app/code-quiz/js/api");

require("csrf");

var Router = Backbone.Router.extend({

    initialize: function(options) {
        this.currentComponent = null;
        this.userModel = options.userModel;
        ProgressBar.init();

        Backbone.on("app:notFound", this.notFound, this);
    },
    
    routes: {
        "creator/concept(/)": "createConcept",
        "creator/concept/:id(/)": "editConcept",
        "creator/course(/)": "createCourse",
        "creator/course/:id(/)": "editCourse",
        "creator/quiz(/)": "createQuiz",
        "creator/quiz/:id(/)": "editQuiz",
        "creator/code-quiz(/)": "createCodeQuiz",
        "creator/code-quiz/:id(/)": "editCodeQuiz",
        "concept/:id(/)": "previewConcept",
        "code-quiz/:id(/)": "attemptCodeQuiz",
        "course/:id(/)": "learnCourse",
        "course/:courseSlug/:conceptSlug(/)": "learnCourseConcept",
        "(/)": "home",
        "login(/)": "gotoLogin",
        "*path": "notFound"
    },

    previewConcept: function(id) {
        this.resetPage();
        Concept.Preview.render({id: id}, this.pageElement);
        this.currentComponent = Concept.Preview;
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
        this._showCourse({});
    },

    editCourse: function(id) {
        this._showCourse({id: id});
    },

    _showCourse: function(options) {
        this.resetPage();
        Course.Creator.render(options, this.pageElement);
        this.currentComponent = Course.Creator;
    },

    learnCourse: function(id) {
        this.resetPage();
        Course.Student.render({id: id}, this.pageElement);
        this.currentComponent = Course.Student;
    },

    learnCourseConcept: function(courseSlug, conceptSlug) {
        this.resetPage();
        Concept.Student.render({
            courseSlug: courseSlug, 
            conceptSlug: conceptSlug
        }, this.pageElement);
        this.currentComponent = Concept.Student;
    },

    createCodeQuiz: function() {
        this._showCodeQuiz({
            id: null
        });
    },

    editCodeQuiz: function(id) {
        this._showCodeQuiz({
            id: id
        });
    },

    _showCodeQuiz: function(options) {
        this.resetPage();
        CodeQuiz.Creator.render(options, this.pageElement);
        this.currentComponent = CodeQuiz.Creator;
    },

    attemptCodeQuiz: function(id) {
        this.resetPage();
        CodeQuiz.Student.render({
            id: id
        }, this.pageElement);
        this.currentComponent = CodeQuiz.Student;
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
        ProgressBar.reset();
        if(this.currentComponent !== null) {
            this.currentComponent.unmount(this.pageElement);
            this.pageElement.remove();
        }
        var page = document.createElement("div");
        page.setAttribute("id", "page-content");
        page.setAttribute("class", "container");
        //this.renderLoading(page);
        var pageFull = document.getElementById("page-full");
        pageFull.appendChild(page);
        this.pageElement = page;
    },

    renderLoading: function(page) {
        var progress = $("<div>").addClass("progress");
        var child = $("<div>").addClass("indeterminate");
        progress.append(child);
        $(page).append(progress);
    },

    home: function() {

        this.resetPage();
        var message = "Home page not designed";
        this.pageElement.innerHTML = message;

        this.currentComponent = this;
        
    },

    notFound: function() {
        this.resetPage();
        var h4 = $("<h4>").html("Oops. Page Not found.").css({
            "margin-top": "3%",
            "text-align": "center"
        });
        $(this.pageElement).append(h4);
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
        UserStatus.render(userModel, document.getElementById("user-status"));
        var router = new Router({userModel: userModel});
        Backbone.history.start({pushState: true});
        console.log(userModel.toJSON());

    });

};

$(document).ready(init);


