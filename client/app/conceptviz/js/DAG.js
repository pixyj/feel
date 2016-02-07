var _ = require("lib")._;

var DAG = function(options) {
    this.nodes = options.nodes || {};
};

DAG.prototype = {

    addNode: function(node) {
        this.nodes[node.id] = {
            node: node,
            starts: {},
            ends: {}
        };
    },

    doesNodeExist: function(id) {
        return !_.isUndefined(this.nodes[id]);
    },

    getNodes: function() {
        return this.nodes
    },      

    addEdge: function(from, to) {
        //console.log("Adding edge from ", from, "to", to);
        this.nodes[from].starts[to] = to;
        this.nodes[to].ends[from] = from;
    },

    removeEdge: function(from, to) {
        delete this.nodes[from].starts[to];
        delete this.nodes[to].ends[from];
        return this;
    },

    //This is an implementation of topological sort as explained by the awesome Prof. Roughgarden
    //https://class.coursera.org/algo/lecture/52
    sort: function() {
        var levels = {};
        var nodes = this.nodes; 

        var keys = Object.keys(nodes);
        var length = keys.length;
        var iterations = 0;
        var currentLevel = 0;
        var nodesByLevel = [];

        while(length) {
            iterations += 1;
            if(iterations === 100) {
                throw new Error("Max Iterations exceeded Error");
            }
            var sourceKeys = [];
            for(var i = 0; i < length; i++) {
                var key = keys[i];
                var node = nodes[keys[i]];
                var endKeys = Object.keys(node.ends);
                if(endKeys.length === 0) {
                    sourceKeys.push(key);
                }
            }
            var sourceLength = sourceKeys.length;
            if(sourceLength === 0) {
                throw new Error("Cycle deteced");
            }
            var levelNodes = [];
            for(var j = 0; j < sourceLength; j++) {
                var key = sourceKeys[j];
                var node = nodes[key];
                levelNodes.push(node.node);
                var otherKeys = Object.keys(node.starts);
                var otherLength = otherKeys.length;
                for(var k = 0; k < otherLength; k++) {
                    delete nodes[otherKeys[k]].ends[key];
                }
                delete nodes[key];
            }
            nodesByLevel.push(levelNodes);
            currentLevel += 1;
            keys = Object.keys(nodes);
            length = keys.length;

        }
        return nodesByLevel;
    },

    _addNodeToLevel: function(nodesByLevel, node, nodeLevel) {

        var levelNodes = nodesByLevel[nodeLevel];
        if(!levelNodes) {
            levelNodes = nodesByLevel[nodeLevel] = [];
        }
        levelNodes.push(node.node);
    },

    getEdges: function() {
        var edges = [];
        var keys = Object.keys(this.nodes);
        _.each(keys, function(key) {
            var node = this.nodes[key];
            var from = node.node.id;
            var others = Object.keys(node.starts);
            var length = others.length;
            for(var i = 0; i < length; i++) {
                edges.push({
                    from: from,
                    to: others[i]
                });
            }
        }, this);
        return edges;
    }
};

DAG.prototype.constructor = DAG;



var run = function() {

    var dag = new DAG({});
    var nodes = [
        {
            name: 1,
            id: "1"
        },
        {
            name: 2,
            id: "2"
        },
        {
            name: 3,
            id: "3"
        },
        {
            name: 4,
            id: "4"
        }
    ];
    var edges = [
        {
            from: 1,
            to: "2"
        },
        {
            from: 2,
            to: "4"
        },
        {
            from: 1,
            to: "3"
        },
        {
            from: 3,
            to: "4"
        }
    ];

    _.each(nodes, function(node) {
        dag.addNode(node);
    });
    _.each(edges, function(edge) {
        dag.addEdge(edge.from, edge.to);
    });
    var levels = dag.sort();
    console.log(levels);
    return levels;
};

//debugging
window.DAG = DAG;

module.exports = {
    DAG: DAG
}