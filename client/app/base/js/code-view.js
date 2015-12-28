var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var utils = require("utils");

var CodeView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options;
        this.domId = "code-editor-{0}".format(utils.getUniqueId());
        var div = $("<div>").attr({
            "id": this.domId,
            "class": "code-editor"
        });
        this.$el.append(div);
    },

    render: function() {
        this.editor = ace.edit(this.domId);
        this.editor.setTheme("ace/theme/chrome");
        this.editor.getSession().setMode("ace/mode/python");
        this.editor.setValue(this.options.code || "");
        this.editor.setShowPrintMargin(false);
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