var _ = require("lib")._;
var Backbone = require("lib").Backbone;
var utils = require("utils");

var SearchModel = Backbone.Model.extend({

    initialize: function(options) {
        var client = algoliasearch(options.APP_ID, options.API_KEY);

        this._indices = _.map(this.INDEX_ATTRS, function(attrs) {
            index = client.initIndex(attrs.name);
            index._attrs = attrs;
            return index;
        });
        this.allObjectsById = {};
    },

    INDEX_ATTRS: [
        {
            name: "concept_names",
            displayName: "Concept",
            snippetFunc: "getConceptNameSnippet"
        },
        {
            name: "concept_text",
            displayName: "Text",
            snippetFunc: "getConceptTextSnippet"
        },
        {
            name: "concept_quizzes",
            displayName: "Quiz",
            snippetFunc: "getQuizSnippet"
        }
    ],

    getConceptNameSnippet: function(obj, query) {
        return obj.name;
    },

    getConceptTextSnippet: function(obj, query) {
        query = query.toLowerCase();
        var text = obj.text;
        var sentences = text.split(". ");
        var length = sentences.length;
        for(var i = 0; i < length; i++) {
            var lowerCaseSentence = sentences[i].toLowerCase();
            var matchPosition = lowerCaseSentence.indexOf(query);
            if(matchPosition !== -1) {
                return sentences[i] + " ... ";
            }
        }
        // assert(false) ? 
        return obj.text.slice(0, 100); 
    },

    getQuizSnippet: function(obj, query) {
        return obj.question_input;
    },

    search: function(query, onResponseReceived, context) {
        context = context || window;

        _.each(this._indices, function(index) {
            var self = this;
            console.info("search", index._attrs.name, query);
            index.search(query).then(function(response) {
                _.each(response.hits, function(obj) {
                    var snippetFunc = index._attrs.snippetFunc;
                    obj.snippet = self[snippetFunc].call(self, obj, query);
                    obj.displayName = index._attrs.displayName;
                    obj.query = query.toLowerCase();
                    obj.indexType = index._attrs.name;
                    console.log(obj.displayName, obj.snippet, obj.url);
                    self.allObjectsById[obj.objectID] = obj;
                    
                });
                onResponseReceived.call(context);
            });
        }, this);
    },

    filterHits: function(query) {
        if(!query) {
            return [];
        }
        var hits = [];
        _.each(this.allObjectsById, function(obj, objectID) {
            if(obj.query.indexOf(query) !== -1) {
                hits.push(obj);
            }
        });
        return _.sortBy(hits, "objectID");
    }


});

module.exports = {
    SearchModel: SearchModel
};