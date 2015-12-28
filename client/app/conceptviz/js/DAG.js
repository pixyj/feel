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
        var nodes = JSON.parse(JSON.stringify(this.nodes));

        var keys = Object.keys(nodes);
        var length = keys.length;
        var iterations = 0;
        while(length) {
            iterations += 1;
            if(iterations === 100) {
                throw new Error("Max Iterations exceeded Error");
            }
            var sinkKeys = [];
            for(var i = 0; i < length; i++) {
                var key = keys[i];
                var node = nodes[keys[i]];
                var startKeys = Object.keys(node.starts);
                if(startKeys.length === 0) {
                    sinkKeys.push(key);
                }
            }
            var sinkLength = sinkKeys.length;
            if(sinkLength === 0) {
                throw new Error("Cycle deteced");
            }
            for(var j = 0; j < sinkLength; j++) {
                var key = sinkKeys[j];
                var node = nodes[key];
                this._addNodeToLevel(levels, node, length-1);
                var otherKeys = Object.keys(node.ends);
                var otherLength = otherKeys.length;
                for(var k = 0; k < otherLength; k++) {
                    delete nodes[otherKeys[k]].starts[key];
                }
                delete nodes[key];
            }
            keys = Object.keys(nodes);
            length = keys.length;
            

        }
        var levelKeys = Object.keys(levels);
        levelKeys.sort();
        var nodesByLevel = [];
        var levelLength = levelKeys.length;
        for(var i = 0; i < levelLength; i++) {
            var key = levelKeys[i];
            var levelNodes = levels[key];
            _.each(levelNodes, function(node) {
                node.parity = (i % 2 === 0) ? "even" : "odd";
            });
            nodesByLevel.push(levelNodes);
        }
        return nodesByLevel;
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
    },

    _addNodeToLevel: function(nodesByLevel, node, nodeLevel) {

        var levelNodes = nodesByLevel[nodeLevel];
        if(!levelNodes) {
            levelNodes = nodesByLevel[nodeLevel] = [];
        }
        levelNodes.push(node.node);
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