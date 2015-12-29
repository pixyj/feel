var _ = require("lib")._;
var Backbone = require("lib").Backbone;


var utils = require("utils");

var base = require("models");
var StreamSaveModel = base.StreamSaveModel;
var NotFoundMixin = require("not-found-mixin").NotFoundMixin;

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
        return "/{0}/".format(this.attributes.slug);
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

//utils.inherit(CourseModel.prototype, NotFoundMixin);

var ConceptModel = Backbone.Model.extend({

    parse: function(attrs) {
        attrs.url = "/creator/concept/{0}/".format(attrs.id);
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
    },

    getConceptQuiz: function(conceptId) {
        return this.attributes[conceptId];
    },

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
            self.dag.addNode(model.toJSON());
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

var StudentStates = {

    NEW_VISITOR: 0,

    COMPLETELY_NEW: 1,

    PRETEST: 2,

    DASHBOARD: 3


};

var StudentStore = function(options) {

    this._channel = options.channel || this;

    this._progress = new ProgressModel({
        id: options.id
    });

    if(this.getState() === null) {
        this.setState(StudentStates.NEW_VISITOR);
    }

};

StudentStore.prototype = {

    STATE_KEY: "student:course:state",

    SKILL_ESTIMATION_KEY: "student:course:skill-estimation",

    /**
     * set student state. Use the number code, not the name
     * @param {int} state
     */
    setState: function(state) {
        this._storeInteger(this.STATE_KEY, state);
        this._channel.trigger("change:state", state, this);
    },

    /**
     * @return {Number}
     */
    getState: function() {
        return this._loadInteger(this.STATE_KEY);
    },

    /**
     * Use the number code, not the name
     * @param {int} level
     */
    setSkillEstimationLevel: function(level) {
        this._storeInteger(this.SKILL_ESTIMATION_KEY, level);
    },

    /**
     * @return {Number}
     */
    getSkillEstimationLevel: function() {
        return this._loadInteger(this.SKILL_ESTIMATION_KEY);
    },

    _storeInteger: function(key, value) {
        localStorage.setItem(key, value);
    },

    _loadInteger: function(key) {
        var value = localStorage.getItem(key);
        if(value === null) {
            return value;
        };
        return parseInt(value);
    },

    /**
    * Get number of questions attempted, total number of questions and progress 
    * in each concept.
    * Example: 
    *   {
    *        "id": "awesome",
    *        "d597a0f8-ba60-45fe-819c-6a7aa0210d6a": {
    *            "total": 4,
    *            "answered": 2,
    *            "progress": 0.5
    *        },
    *        "906be0d8-aaa0-458b-ab04-6330f956975f": {
    *            "total": 5,
    *            "answered": 2,
    *            "progress": 0.4
    *        },
    *        "92416f00-2228-4799-8caa-d7cb27286eef": {
    *            "total": 1,
    *            "answered": 1,
    *            "progress": 1
    *        }
    *    }
    * @return {object} 
    */
    getProgress: function() {
        return this._progress.toJSON();
    },

    /**
    *  1. Fetch student progress
    *  2. Return a promise that is resolved after step 3
    *  3. If the student has answered at least one quiz correctly, show dashboard 
    *  @return {Promise}
    */
    fetch: function() {

        var self = this;
        return this._progress.fetch().then(function() {
            if(!self._progress.isNew()) {
                self.setState(StudentStates.DASHBOARD);
            }
        });
    }
};

StudentStore.prototype.constructor = StudentStore;
_.extend(StudentStore.prototype, Backbone.Events);


module.exports = {
    CreatorStore: CreatorStore,
    StudentStore: StudentStore,
    PretestModel: PretestModel,
    StudentStates: StudentStates
};
