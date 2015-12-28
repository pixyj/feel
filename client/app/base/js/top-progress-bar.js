var Backbone = require("lib").Backbone;
var utils = require("utils");

var View = Backbone.View.extend({
    el: "#top-progress-bar",

    initialize: function() {
        this.progress = this.$el.find(".determinate");
        this._timer = null;
    },

    setProgress: function(fraction) {
        if(this._timer) {
            clearTimeout(this._timer);
        }
        this.$el.css({
            visibility: "visible"
        });
        this.progress.css({
            width: (fraction * 100) + "%"
        });

        if(fraction === 1) {
            var self = this;
            this._timer = setTimeout(function() {
                self.reset();
            }, 320);
        }

        return this;
    },

    reset: function() {
        this._resetTimer();
        this.$el.css({
            visibility: "hidden"
        });
        this.progress.css({
            width: "0%"
        });
    },

    _resetTimer: function() {
        if(this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }


});


var view = null;

var init = function() {
    if(view === null) {
        view = new View();
        window.p = view;
    }
};

var setProgress = function(fraction ) {
    utils.assert(fraction >= 0 && fraction <= 1);
    view.setProgress(fraction);
};

var reset = function() {
    view.reset();
}

module.exports = {
    init: init,
    setProgress: setProgress,
    reset: reset
};