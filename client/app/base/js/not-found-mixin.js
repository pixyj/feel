var Backbone = require("lib").Backbone;

var NotFoundMixin = {

    initialize: function() {
        this.on("error", this.onError, this);
    },

    onError: function(self, response) {
        if(response && response.status && response.status === 404) {
            Backbone.trigger("app:notFound");
        }
    },
};

module.exports = {
    NotFoundMixin: NotFoundMixin
}