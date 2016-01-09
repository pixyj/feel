console.log("hi there");

// move to 

var inc = function(obj, key) {
    if(obj[key] === undefined) {
        obj[key] = 0;
    }
    obj[key] += 1;
    return obj[key];
};

var View = Backbone.View.extend({

    el: "#graph",

    LEVEL_GAP: 80,

    MINIMUM_NODE_HEIGHT: 60,

    LEVEL_PADDING: 20,

    LEVEL_GUTTER_WIDTH_FRACTION: 0.4,

    initialize: function(options) {
        this.graph = options.graph;

        //for performance reasons, these values are calculated
        //during calculating traffic. 
        this._elementsById = {};
        this._levelByNodeId = {};
    },

    highlightNode: function(id) {

    },

    traverse: function(from, two, time) {

    },

    render: function() {
        var width = this.$el.width();
        console.log("width: ", width);
        var nodeElementsById = this.renderNodesAtAllLevels(this.graph.levels, width);
        console.log(nodeElementsById);
        var traffic = this.computeInfoRequiredToRenderEdges();
        this.renderEdges(nodeElementsById, traffic);
        return this;
    },

    renderNodesAtAllLevels: function(levels, totalWidth) {

        var cumulativeHeight = 0;
        var depth = levels.length;
        var elements = {};
        for(var i = 0; i < depth; i++) {
            var attrs = {
                nodes: levels[i],
                level: i,
                totalWidth: totalWidth,
                topPosition: cumulativeHeight
            };
            var result = this.renderLevelNodes(attrs);
            cumulativeHeight += result.height + this.LEVEL_GAP;
            _.extendOwn(elements, result.elements);
        }
        return elements;
    },

    renderLevelNodes: function(attrs) {
        
        var nodes = attrs.nodes;
        var level = attrs.level;
        var width = attrs.totalWidth;
        var topPosition = attrs.topPosition;

        var result = {
            elements: {},
            height: 0
        }

        var length = nodes.length;
        
        var payloadFraction = (1 - this.LEVEL_GUTTER_WIDTH_FRACTION);
        var allNodesWidth = (width - 2*this.LEVEL_PADDING) * payloadFraction;
        var allGuttersWidth = (width -2*this.LEVEL_PADDING) * this.LEVEL_GUTTER_WIDTH_FRACTION;
        
        var nodeWidth = Math.floor(allNodesWidth / length);
        var gutterWidth = Math.floor(allGuttersWidth / (length + 1));
        var currentLeftPosition = this.LEVEL_PADDING + gutterWidth;
        var elements = result.elements;
        var maxHeight = 0;
        for(var i = 0; i < length; i++) {
            
            var node = nodes[i];
            var elAndAttrs = this.renderNode({
                node: node,
                topPosition: attrs.topPosition,
                leftPosition: currentLeftPosition,
                width: nodeWidth
            });

            //caching this now so that we can use it to calculate traffic. 
            this._levelByNodeId[node.id] = level;

            elements[node.id] = elAndAttrs;
            var maxHeight = _.max([elAndAttrs.height, maxHeight]);
            currentLeftPosition += nodeWidth + gutterWidth;
        }

        _.each(elements, function(elAndAttrs) {
            elAndAttrs.el.height(maxHeight);
            elAndAttrs.height = maxHeight;
        });

        result.height = maxHeight;
        return result;
    },

    renderNode: function(attrs) {

        var node = attrs.node;
        var name = $("<h5 class='center'>").html(node.name);
        var el = $("<div>").css({
            width: attrs.width,
            top: attrs.topPosition,
            left: attrs.leftPosition,
            position: 'absolute'
        }).addClass("card graph-node").append(name);

        this.$el.append(el);
        this._elementsById[node.id] = el;

        return {
            el: el,
            height: el.height(),
            width: attrs.width,
            top: attrs.topPosition,
            left: attrs.leftPosition,
            id: node.id
        };
    },

    computeInfoRequiredToRenderEdges: function() {
        return this.getTrafficInfo();
    },

    getTrafficInfo: function() {
        var trafficByLevelGap = {};
        var gutterTrafficByLevel = {};
        var edgesDrawnThroughLevelGap = {};
        var edgesDrawnThroughGutter = {};

        var inboundEdgesByNodeId = {};
        var outboundEdgesByNodeId = {};
        var inboundNodeEdgesDrawn = {};
        var outboundNodeEdgesDrawn = {};



        _.each(this.graph.edges, function(edge) {
            var startLevel = this._levelByNodeId[edge.from];
            var endLevel = this._levelByNodeId[edge.to];

            inc(outboundEdgesByNodeId, edge.from);
            inc(inboundEdgesByNodeId, edge.to);
            outboundNodeEdgesDrawn[edge.from] = 0;
            inboundNodeEdgesDrawn[edge.to] = 0;

            for(var i = startLevel; i < endLevel; i++) {
                var fromLevel = i;
                var toLevel = i + 1;
                var key = this.getLevelGapKey(fromLevel, toLevel);
                inc(trafficByLevelGap, key);
                if(toLevel !== endLevel) {
                    inc(gutterTrafficByLevel, toLevel);
                }
            }

        }, this);

        _.each(trafficByLevelGap, function(value, key) {
            edgesDrawnThroughLevelGap[key] = 0;
        });
        _.each(gutterTrafficByLevel, function(value, key) {
            edgesDrawnThroughGutter[key] = 0;
        });

        return {
            inboundEdgesByNodeId: inboundEdgesByNodeId,
            outboundEdgesByNodeId: outboundEdgesByNodeId,
            inboundNodeEdgesDrawn: inboundNodeEdgesDrawn,
            outboundNodeEdgesDrawn: outboundNodeEdgesDrawn,
            trafficByLevelGap: trafficByLevelGap,
            edgesDrawnThroughLevelGap: edgesDrawnThroughLevelGap,
            gutterTrafficByLevel: gutterTrafficByLevel,
            edgesDrawnThroughGutter: edgesDrawnThroughGutter
        };
    },

    getLevelGapKey: function(startLevel, endLevel) {
        return startLevel + "->" + endLevel;
    },

    //http://stackoverflow.com/questions/20107645/minimizing-number-of-crossings-in-a-bipartite-graph
    renderEdges: function(nodeElements, traffic) {

        var outboundEdgesByNodeId = traffic.outboundEdgesByNodeId;
        var inboundEdgesByNodeId = traffic.inboundEdgesByNodeId;
        var outboundNodeEdgesDrawn = traffic.outboundNodeEdgesDrawn;
        var inboundNodeEdgesDrawn = traffic.inboundNodeEdgesDrawn;


        _.each(this.graph.edges, function(edge) {
            var startNode = nodeElements[edge.from];
            var endNode = nodeElements[edge.to];

            var startId = startNode.id;
            var endId = endNode.id;

            var startPoint = this.getStartPoint(startNode, outboundEdgesByNodeId, outboundNodeEdgesDrawn);
            var endPoint = this.getEndPoint(endNode, inboundEdgesByNodeId, inboundNodeEdgesDrawn);
            

            this.drawPoint(startPoint, edge);
            this.drawPoint(endPoint, edge);
        }, this);
    },

    getStartPoint: function(node, edgesById, edgesDrawn) {
        var point =  this.getPoint(node, edgesById, edgesDrawn);
        point.y += node.height;
        return point;
    },

    getEndPoint: function(node, edgesById, edgesDrawn) {
        return this.getPoint(node, edgesById, edgesDrawn);
    },

    getPoint: function(node, edgesById, edgesDrawn) {
        var id = node.id;
        var width = node.width;
        
        var total = edgesById[id];
        var drawn = edgesDrawn[id];
        inc(edgesDrawn, id);

        var pieces = width / (total + 1);
        var x = node.left + (drawn + 1) * pieces;

        var y = node.top;

        return {
            x: x,
            y: y
        }
    },

    drawPoint: function(point, edge) {
        console.debug("Point", point, "Edge", edge);
        div = $("<div>").css({
            top: point.y,
            left: point.x,
            position: 'absolute'
        }).addClass("graph-line");
        this.$el.append(div);
    }

});


g = {
    levels: [
        [
            {
                id: 1,
                name: "One",
            }
        ],
        [
            {
                id: 2,
                name: "Two",
            },
            {
                id: 3,
                name: "Three",
            },
            {
                id: 4,
                name: "Four",
            }
        ],
        [
            {
                id: 5,
                name: "Five",
            },
            {
                id: 6,
                name: "Guiness Book of world records broken by Messi",
            }
        ],
        [
            {
                id: 7,
                name: "Seven",
            },
            {
                id: 8,
                name: "Eight",
            }
            // {
            //     id: 9,
            //     name: "Reader's Digest Book of Facts",
            // },
            // {
            //     id: 10,
            //     name: "Ten",
            // }
        ]
    ],

    // adjacencyHash: {

    //     1: {
    //         starts: {
    //             2: 2,
    //             3: 3,
    //             4: 4
    //         },
    //         ends: {

    //         }
    //     },

    //     2: {
    //         starts: {
    //             7: 2
    //         },
    //         ends: {
    //             1: 1
    //         }
    //     },

    //     3: {
    //         starts: {
    //             5: 5
    //         },
    //         ends: {
    //             1: 1
    //         }
    //     },

    //     4: {
    //         starts: {
    //             6: 6
    //         },
    //         ends: {
    //             1: 1
    //         }
    //     },

    //     5: {
    //         starts: {
    //             7: 7
    //         },
    //         ends: {
    //             3: 3
    //         }
    //     },

    //     6: {
    //         starts: {
    //             8: 8
    //         },
    //         ends: {
    //             4: 4
    //         }
    //     },

    //     7: {
    //         starts: {
                
    //         },
    //         ends: {
    //             4: 4,
    //         }
    //     },

    //     8: {
    //         starts: {
                
    //         },
    //         ends: {
    //             6: 6,
    //         }
    //     }
    // },

    edges: [
        {
            from: 1,
            to: 2
        },
        {
            from: 1,
            to: 3
        },
        {
            from: 1,
            to: 4
        },
        {
            from: 3,
            to: 5
        },
        {
            from: 4,
            to: 6
        },
        {
            from: 5,
            to: 7
        },
        {
            from: 6,
            to: 8
        },
        {
            from: 2,
            to: 7
        },
        {
            from: 3,
            to: 8
        },
        {
            from: 1,
            to: 6
        }
    ]
};
var init = function() {
    window.view = new View({
        graph: g
    });
    window.view.render();
};  

$(document).ready(init);