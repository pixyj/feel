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



module.exports = {
    UserModel: UserModel
};