var _ = require("underscore");
var Backbone = require("backbone");

var CodeView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options;
        var div = $("<div>").attr("id", "code-editor");
        this.$el.append(div);
    },

    render: function() {
        this.editor = ace.edit("code-editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.getSession().setMode("ace/mode/python");
        this.editor.setValue(this.options.code || "");
        window.editor = this.editor;
        
        if(this.options.listenToInputChange) {
            this.listenToInputChange();
        }
        return this;
    },

    listenToInputChange: function() {
        var self = this;
        this.editor.on("input", function() {
            self.trigger("change", self.val());
        });
    },

    val: function() {
        return this.editor.getValue();
    },

    remove: function() {
        this.editor.off();
        Backbone.View.prototype.remove.call(this);
    }
});

module.exports = {
    CodeView: CodeView
};