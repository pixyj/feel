console.log("hi there");



var View = Backbone.View.extend({

    el: "#graph",

    LEVEL_GAP: 80,

    MINIMUM_NODE_HEIGHT: 60,

    LEVEL_PADDING: 20,

    LEVEL_GUTTER_WIDTH_FRACTION: 0.4,

    initialize: function(options) {
        this.graph = options.graph;
        this._elementsById = {};
    },

    highlightNode: function(id) {

    },

    traverse: function(from, two, time) {

    },

    render: function() {
        var width = this.$el.width();
        console.log("width: ", width);
        this.renderNodesAtAllLevels(this.graph.levels, width);
        return this;
    },

    renderNodesAtAllLevels: function(levels, totalWidth) {

        var cumulativeHeight = 0;
        var depth = levels.length;
        for(var i = 0; i < depth; i++) {
            var attrs = {
                nodes: levels[i],
                depth: i,
                totalWidth: totalWidth,
                topPosition: cumulativeHeight
            };
            var result = this.renderLevelNodes(attrs);
            cumulativeHeight += result.height + this.LEVEL_GAP;
        }
    },

    renderLevelNodes: function(attrs) {
        
        var nodes = attrs.nodes;
        var depth = attrs.depth;
        var width = attrs.totalWidth;
        var topPosition = attrs.topPosition;

        var result = {
            elements: [],
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
            
            var elAndHeight = this.renderNode({
                node: nodes[i],
                topPosition: attrs.topPosition,
                leftPosition: currentLeftPosition,
                width: nodeWidth
            });

            elements.push(elAndHeight.el);
            var maxHeight = _.max([elAndHeight.height, maxHeight]);
            currentLeftPosition += nodeWidth + gutterWidth;
        }

        _.each(elements, function(el) {
            el.height(maxHeight);
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
        }).addClass("card").append(name);

        this.$el.append(el);
        this._elementsById[node.id] = el;

        return {
            el: el,
            height: el.height()
        };
    },

    calculateLevelGapAndGutterTraffic: function() {
        this.calculateLevelGapTraffic();
    },

    calculateLevelGapTraffic: function() {
        var trafficByLevelGap = {};
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

    adjacencyHash: {

        1: {
            starts: {
                2: 2,
                3: 3,
                4: 4
            },
            ends: {

            }
        },

        2: {
            starts: {
                7: 2
            },
            ends: {
                1: 1
            }
        },

        3: {
            starts: {
                5: 5
            },
            ends: {
                1: 1
            }
        },

        4: {
            starts: {
                6: 6
            },
            ends: {
                1: 1
            }
        },

        5: {
            starts: {
                7: 7
            },
            ends: {
                3: 3
            }
        },

        6: {
            starts: {
                8: 8
            },
            ends: {
                4: 4
            }
        },

        7: {
            starts: {
                
            },
            ends: {
                4: 4,
            }
        },

        8: {
            starts: {
                
            },
            ends: {
                6: 6,
            }
        }
    },

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
            from: 2,
            to: 7
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