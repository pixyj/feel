var React = require("react");

var ListMixin = {

    createList: function(attrs) {

        var ComponentClass = attrs.ComponentClass;
        var collection = attrs.collection;
        var buildPropsFn = attrs.buildProps;

        var length = collection.length;
        var components = [];
        for(var i = 0; i < length; i++) {
            var props = buildPropsFn.call(this, collection[i], i);
            var c = <ComponentClass key={i} {...props} />
            components.push(c);
        }
        return components;
    }

};

module.exports = {
    ListMixin: ListMixin
};