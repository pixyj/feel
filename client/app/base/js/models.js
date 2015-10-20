var Backbone = require("backbone");
var _ = require("underscore");

var UserModel = Backbone.Model.extend({

    defaults: {
        isAnonymous: true
    },

    url: function() {
        return "/api/v1/user/"
    },

    isAuthenticated: function() {
        return !this.attributes.isAnonymous;
    }
});

var VersionedModel = Backbone.Model.extend({

    initialize: function() {
        this.isFirstVersionSaved = !this.isNew();
        this.unsavedVersions = [];
    },

    save: function(key, value, options) {
        this.attributes.version = this.isNew() ? 1 : this.attributes.version + 1;
        if(this.isFirstVersionSaved) {
            return Backbone.Model.prototype.save.call(this, key, value, options);
        }
        
        this.once("sync", this.onFirstVersionSaved, this);
        if(this.attributes.version === 1) {
            return Backbone.Model.prototype.save.call(this, key, value, options);
        }
        //warning. Cannot use promise in this case.
        this.unsavedVersions.push(this.toJSON());
    },

    onFirstVersionSaved: function() {
        this.isFirstVersionSaved = true;
        _.each(this.unsavedVersions, function(attributes) {
            var model = new this.constructor();
            model.attributes = attributes;
            model.save();
        }, this);
        this.unsavedVersions = [];
        this.trigger("firstVersionSaved");
    }
});

module.exports = {
    UserModel: UserModel,
    VersionedModel: VersionedModel
};