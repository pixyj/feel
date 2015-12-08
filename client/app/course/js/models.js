var _ = require("underscore");
var Backbone = require("backbone");

var StreamSaveModel = require("models").StreamSaveModel;
var utils = require("utils");

var DAG = require("./../../conceptviz/js/DAG").DAG;

/********************************************************************************
*  Creator Models:
*
*
*********************************************************************************/

var CourseModel = StreamSaveModel.extend({

    defaults: {
        name: "",
        isPublished: false
    },

    BASE_URL: "/api/v1/courses/",

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.id);
    },

    studentURL: function() {
        utils.assert(this.attributes.slug, "Slug not found");
        return "#/{0}/".format(this.attributes.slug);
    },

    creatorURL: function() {
        var base = "/creator/course/";
        var url;
        if(this.attributes.isPublished) {
            url = "{0}{1}/".format(base, this.attributes.slug);
        }
        else {
            url = "{0}{1}/".format(base, this.attributes.id);
        }
        return url;
    }
});

var ConceptModel = Backbone.Model.extend({

    parse: function(attrs) {
        attrs.url = "/#creator/concept/{0}/".format(attrs.id);
        return attrs;
    }
});

var ConceptCollection = Backbone.Collection.extend({

    initialize: function(options) {
        this.course = options.course;
        this.dag = options.dag;
    },

    model: ConceptModel,

    url: function() {
        return "{0}concepts/".format(this.course.url())
    },

    parse: function(concepts) {
        _.each(concepts, function(c) {
            this.dag.addNode(c);
        }, this);

        return concepts;
    }
});

var DependencyModel = Backbone.Model.extend({

});

var DependencyCollection = Backbone.Collection.extend({

    model: DependencyModel,

    initialize: function(options) {
        this.course = options.course;
        this.dag = options.dag;
    },

    url: function() {
        return "{0}dependencies/".format(this.course.url());
    },

    //from is a keyword in Python, so I'm using start and end on the server
    //todo -> change client code to start and end as well. 
    parse: function(response) {

        var deps = [];
        _.each(response, function(d) {
            deps.push({
                from: d.start,
                to: d.end
            });
        });
        return deps;
    },

    initializeDAG: function() {
        _.each(this.toJSON(), function(dep) {
            this.dag.addEdge(dep.from, dep.to);
        }, this);
    }
});

var PretestModel = Backbone.Model.extend({

    url: function() {
        return "/api/v1/courses/{0}/pretest/".format(this.attributes.id);
    }

});

/********************************************************************************
*  Creator Store:
*
*
*********************************************************************************/

var CreatorStore = function(options) {
    
    if(!options.hasOwnProperty("setRoute")) {
        options.setRoute = true;
    } 
    this.options = options;

    this.dag = new DAG({});


    this._course = new CourseModel(options);
    this._concepts = new ConceptCollection({course: this._course, dag: this.dag});
    this._dependencies = new DependencyCollection({course: this._course, dag: this.dag});

    if(this._course.isNew()) {
        this._course.once("sync", this.setRoute, this);
    }
    this.listenToEvents();
    window.course = this._course;
};

CreatorStore.prototype = {

    listenToEvents: function() {
        this._course.on("sync", this.onCourseSynced, this);
    },

    cleanup: function() {
        this._course.off("sync", this.onCourseSynced);
    },

    getName: function() {
        return this._course.get("name");
    },

    setName: function(name) {
        this._course.set("name", name);
        this._course.save();
    },

    isPublished: function() {
        return this._course.attributes.isPublished;
    },

    getStudentURL: function() {
        return this._course.studentURL();
    },

    togglePublish: function() {
        var isPublished = !this.isPublished();
        this._course.set({
            isPublished: isPublished
        });

        var self = this;
        this._isPublishedChanged = true;
        this._course.save();
    },

    onCourseSynced: function() {
        if(!this._isPublishedChanged) {
            return;
        }
        this.setRoute(true);
        this._isPublishedChanged = false;
        this.trigger("change:isPublished", this.isPublished(), this);
    },

    getConcepts: function() {
        return this._concepts.toJSON();
    },

    addConcept: function(concept) {

        var model = this._concepts.add(concept);
        var self = this;

        var onSaved = function() {
            self.trigger("add:concept", concept, self);
        }
        if(model.isNew()) {
            model.save().then(onSaved);
        }
        else {
            onSaved();
        }
    },

    addDependency: function(from, to) {

        var edge = {
            from: from,
            to: to
        };

        var nodesByLevel;
        try {
            this.dag.addEdge(from, to);
            nodesByLevel = this.dag.sort();    
        } catch (e) {
            this.dag.removeEdge(from, to);
            return false;
        }
        
        var model = this._dependencies.add(edge);
        var self = this;
        var onSaved = function() {
            var edges = self.dag.getEdges();
            var graph = {
                levels: nodesByLevel,
                edges: edges
            }
            self.trigger("add:dependency", graph, edge);
        };

        if(model.isNew()) {
            model.save().then(onSaved);
        }
        else {
            onSaved();
        }
        
        return true;
    },

    getRootConcept: function() {

        var graph = this.getGraph();
        var levels = graph.levels;
        if(!levels.length) {
            return null;
        }
        return levels[0][0];
    },

    getConceptURL: function(conceptSlug) {
        return "{0}{1}/".format(this._course.studentURL(), conceptSlug);
    },

    getGraph: function() {
        return {
            levels: this.dag.sort(),
            edges: this.dag.getEdges()
        };
    },

    fetch: function() {
        
        if(this._course.isNew()) {
            return $.Deferred().resolve().promise() 
        }

        var one = this._course.fetch();
        var two = this._concepts.fetch();
        var three = this._dependencies.fetch();

        var promises = [one, two, three];

        var self = this;
        var fetchedPromise = $.when.apply($, promises);
        fetchedPromise.then(function() {
            self._dependencies.initializeDAG();
            self.setRoute(true);
        });

        return fetchedPromise;

    },

    setRoute: function(replace) {

        if(!this.options.setRoute) {
            return;
        }
        replace = replace || false;
        var url = this._course.creatorURL();
        Backbone.history.navigate(url, {trigger: false, replace: replace});
    }

};

_.extend(CreatorStore.prototype, Backbone.Events);
CreatorStore.prototype.constructor = CreatorStore;

/********************************************************************************
*  Student Models and Stores
*
*
*********************************************************************************/

var ProgressModel = Backbone.Model.extend({

    url: function() {
        return "/api/v1/courses/{0}/student-progress/".format(this.attributes.id);
    },

    isNew: function() {

        var keys = Object.keys(this.attributes);
        var length = keys.length;
        for(var i = 0; i < length; i++) {
            var progress = this.attributes[keys[i]];
            if(progress.answered > 0) {
                return false;
            }
        }
        return true;
    },

    parse: function(response) {
        _.each(response, function(attrs, id) {
            attrs.progress = this.calculateProgress(attrs.answered, attrs.total);
        }, this);
        return response;
    },

    calculateProgress: function(answered, total) {
        if(total === 0) {
            return 1;
        }
        return answered / total;
    }

});

var StudentStore = function(options) {
    this._progress = new ProgressModel({
        id: options.id
    });
};

StudentStore.prototype = {

    SKILL_ESTIMATION_KEY: "course:skillEstimation",

    setSkillEstimationLevel: function(level) {
        localStorage.setItem(this.SKILL_ESTIMATION_KEY, level);
    },

    getSkillEstimationLevel: function() {
        return localStorage.getItem(this.SKILL_ESTIMATION_KEY);
    },

    isUserNew: function() {
        var isSkillEstimated = localStorage.getItem(this.SKILL_ESTIMATION_KEY) === null;
        var hasAnsweredAtLeastOneQuiz = this._progress.isNew();
        return !isSkillEstimated && !hasAnsweredAtLeastOneQuiz;
    },

    fetch: function() {
        return this._progress.fetch();
    },

    getProgress: function() {
        return this._progress.toJSON();
    }
};

StudentStore.prototype.constructor = StudentStore;
_.extend(StudentStore.prototype, Backbone.Events);


module.exports = {
    CreatorStore, CreatorStore,
    StudentStore: StudentStore,
    PretestModel: PretestModel
};
