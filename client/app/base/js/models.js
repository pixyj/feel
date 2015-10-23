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

        this.on("sync", this.onVersionSaved, this);
    },

    save: function(key, value, options) {
        
        options = options || {};
        options.parse = false;

        this.attributes.version = this.isNew() ? 1 : this.attributes.version + 1;
        
        if(this.isFirstVersionSaved) {
            if(this.unsavedVersions.length) {
                this.unsavedVersions.push(this.toJSON());
            }
            else {
                console.log("Saving version", this.attributes.version, this.attributes.questionInput);
                return Backbone.Model.prototype.save.call(this, key, value, options);
            }
        }
        else if(this.attributes.version === 1) {
            console.log("Saving version", this.attributes.version);
            return Backbone.Model.prototype.save.call(this, key, value, options);
        }
        else {
            //warning. Cannot use promise in this case.
            this.unsavedVersions.push(this.toJSON());
        }

    },

    onVersionSaved: function(response) {
        this.isFirstVersionSaved = true;
        if(this.unsavedVersions.length) {
            var lastVersion = this.unsavedVersions[this.unsavedVersions.length-1];
            var model = new this.constructor();
            model.attributes = lastVersion;

            model.once("sync", this.onVersionSaved, this);
            console.log("Saving version", model.attributes.version);
            model.save(null, {parse: false});
            this.unsavedVersions = [];
        }
    }
});

module.exports = {
    UserModel: UserModel,
    VersionedModel: VersionedModel
};