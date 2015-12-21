var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var base = require("models");
var StreamSaveModel = base.StreamSaveModel;
var NotFoundMixin = base.NotFoundMixin;

var ConceptModel = StreamSaveModel.extend({

    defaults: {
        name: "",
        sections: [],
        isPublished: false
    },

    BASE_URL: "/api/v1/concepts/",

    url: function() {
        if(this.isNew()) {
            return this.BASE_URL;
        }
        return "{0}{1}/".format(this.BASE_URL, this.attributes.id);
    }

});
utils.inherit(ConceptModel.prototype, NotFoundMixin);

var StudentConceptPageModel = Backbone.Model.extend({

    url: function() {
        return "/api/v1/student/concepts/{0}/".format(this.attributes.id)
    }

});
utils.inherit(StudentConceptPageModel.prototype, NotFoundMixin);

var StudentCourseConceptPageModel = Backbone.Model.extend({

    url: function() {
        var attrs = this.attributes;
        return "/api/v1/courses/{0}/concepts/{1}/".format(attrs.courseSlug,
            attrs.conceptSlug);
    }

});
utils.inherit(StudentCourseConceptPageModel.prototype, NotFoundMixin);

module.exports = {
    ConceptModel: ConceptModel,
    StudentConceptPageModel: StudentConceptPageModel,
    StudentCourseConceptPageModel: StudentCourseConceptPageModel
};