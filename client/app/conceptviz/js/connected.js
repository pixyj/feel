"use strict";

var $ = require("lib").$;
var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var app = {
    levelGap: 80,
    LevelZeroGap: 20,
    ns: 'http://www.w3.org/2000/svg',
    NO_JUMP_STRAIGHT: 1,
    NO_JUMP_CRISS_CROSS: 2,
    JUMP: 3,
    SVG_PADDING_FRACTION: 0.05,
    STROKE_WIDTH: 3,
    view: null
};

var drawArrowEntry = function(nodeAttrs, svg) {
    var circle = document.createElementNS(app.ns, 'circle');
    var attrs = {
        cx: nodeAttrs.arrowEntry_x,
        cy: nodeAttrs.arrowEntry_y,
        r: 5,
        fill: "red"
    };

    //#todo -> add a python like iteritems function to utils
    _.each(_.keys(attrs), function(key) {
        circle.setAttribute(key, attrs[key]);
    });
    //console.info("Circle", attrs);
    //svg.append(circle);
};

var drawCircle = function(attrs, svg) {
    var circle = document.createElementNS(app.ns, 'circle');

    _.each(_.keys(attrs), function(key) {
        circle.setAttribute(key, attrs[key]);
    });
    svg.append(circle);
}

var getForeignObjectAttrs = function(levelIndex, position, levelConceptCount, levelWidth, levelHeight) {

    var leftPadding, rightPadding; 
    var paddingFraction = app.SVG_PADDING_FRACTION;
    //5% padding each side
    leftPadding = rightPadding = levelWidth * paddingFraction / 2; 
    
    var payloadWidth = levelWidth * (1 - paddingFraction);
    var totalGapBetweenNodes, totalNodeWidth;
    if(levelConceptCount === 1) {
        totalGapBetweenNodes = 0;
        totalNodeWidth = payloadWidth * 0.5;
        leftPadding += payloadWidth * 0.25;
    }
    else {
        totalGapBetweenNodes = Math.floor(payloadWidth * 0.1);
        totalNodeWidth = Math.floor(payloadWidth * 0.9);
    }
    var nodeWidth = totalNodeWidth / levelConceptCount;

    var leftMarginWidth;
    if(levelConceptCount === 1) {
        leftMarginWidth = 0;
    }
    else {
        leftMarginWidth = totalGapBetweenNodes / (levelConceptCount - 1);
    }

    var x = leftPadding + position*nodeWidth + position*leftMarginWidth;

    var attrs = {
        x: x,
        y: levelHeight,
        width: nodeWidth
    };

    return attrs;
};

var drawNode = function(node, levelIndex, position, levelConceptCount, 
    svgAttrs, levelHeight, showProgress) {
    
    var svg = svgAttrs.svg;
    var svgWidth = svgAttrs.width;


    var progress = $("<div>");
    if(showProgress && node.progress && node.progress !== 0) {

        var determinate = $("<div>").addClass("progress-bar determinate").css({
            width: (node.progress * 100) + "%"
        });
        progress.addClass("progress").append(determinate).css({
            margin: "0",
            height: "6px"
        });
    };

    var parityClass = "concept-box-" + node.parity;
    var content = $("<a>").attr("href", node.url).addClass(parityClass);
    var h4 = $("<h5>").html(node.name);
    content.append(h4).append(progress);

    var parent = $("<div>").addClass("concept-box card");
    parent.append(content);
    var p = parent;

    //foreignObject does not work on IE #todo. But my initial technical audience does not use IE, I guess? 
    //And making aligning svg text is a pain
    var attrs = getForeignObjectAttrs(levelIndex, position, levelConceptCount, svgWidth, levelHeight);
    var f = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    console.info("Node", attrs, node, " at level ", levelIndex, " in position", position);


    f = $(f).append(p).attr(attrs);
    svg.append(f);
    var height = p.height();
    f.attr("height", height); //for safari

    return {
        width: attrs.width,
        height: height,
        arrowEntry_x: Math.floor( (attrs.x*2 + attrs.width)/2 ),
        arrowEntry_y: Math.floor( (attrs.y - app.levelGap/2) ),
        x: attrs.x,
        y: attrs.y,
        node: f,
        f: f,
        p: p,
        el: content,
        levelIndex: levelIndex,
        levelConceptCount: levelConceptCount,
        levelPosition: position,
        drawnOutEdges: 0,
        drawnInEdges: 0
    };
};

var drawLevelNodes = function(level, levelIndex, svgAttrs, levelHeight, showProgress) {

    var i, length;
    length = level.length;


    var maxHeight = 0;
    var levelNodes = {};
    var levelNodesArray = [];
    for(i = 0; i < length; i++) {
        var node = level[i];
        var nodeAttrs = drawNode(node, levelIndex, i, length, svgAttrs, levelHeight, showProgress);
        levelNodes[node.id] = nodeAttrs;
        levelNodesArray.push(nodeAttrs);
        var height = nodeAttrs.height;
        maxHeight = _.max([maxHeight, height]);
        drawArrowEntry(nodeAttrs, svgAttrs.svg);
    }
    console.info("Max height at level ", levelIndex, " is ", maxHeight);
    console.info("-----------------------   End of level ", levelIndex,  "-------------------------------");

    _.each(levelNodes, function(n) {
        n.p.css("height", maxHeight);
        n.f.attr("height", maxHeight); //for safari -> which is taking me on a safari. 
        n.height = maxHeight;        
    });

    //callejon -> Yeah, I know one Spanish word from the song `La diosa del carnaval`
    var alleys = [];
    var length = levelNodesArray.length;

    for(var j = 1; j < length; j++) {
        var one = levelNodesArray[j-1];
        var two = levelNodesArray[j];
        var alleyAttrs = {
            start_x: one.x + one.width,
            end_x: two.x,
            start_y: one.y,
            end_y: one.y + one.height,
            levelIndex: levelIndex,
            id: levelIndex + "-" + one.levelPosition + "-" + two.levelPosition,
            drawnCount: 0,
            totalCount: 0
        }
        alleys.push(alleyAttrs);
        
    }

    if(length === 1) {
        var onlyNode = levelNodesArray[0];
        var levelWidth = svgAttrs.width;
        var paddingWidth = app.SVG_PADDING_FRACTION * levelWidth;
        var payloadWidth = (1 - app.SVG_PADDING_FRACTION) * levelWidth;


        var leftAlleyAttrs = {
            start_x: paddingWidth/2,
            end_x: onlyNode.x,
            start_y: onlyNode.y,
            end_y: onlyNode.y + onlyNode.height,
            levelIndex: levelIndex,
            id: levelIndex + "-" + "left",
            drawnCount: 0,
            totalCount: 0
        };
        alleys.push(leftAlleyAttrs);
        var rightAlleyAttrs = {
            start_x: onlyNode.x + onlyNode.width,
            end_x: levelWidth - paddingWidth/2,
            start_y: onlyNode.y,
            end_y: onlyNode.y + onlyNode.height,
            levelIndex: levelIndex,
            id: levelIndex + "-" + "right",
            drawnCount: 0,
            totalCount: 0

        }
        alleys.push(rightAlleyAttrs);
    }

    return {
        levelNodes: levelNodes,
        maxHeight: maxHeight,
        alleys: alleys
    };
};

var drawLine = function(attrs, svg) {

    var line = document.createElementNS(app.ns, 'line');

    //#todo -> add a python like iteritems function to utils
    _.each(_.keys(attrs), function(key) {
        line.setAttribute(key, attrs[key]);
    });

    svg.append(line);
};

var testDrawLine = function(svg) {

    var attrs = {
        x1: 100,
        y1: 50,
        x2: 100,
        y2: 500,
        stroke: "black",
        "stroke-width": app.STROKE_WIDTH,
        "marker-end": "url(#Triangle)"
    };
    drawLine(attrs, svg);
};   


var isTwoDirectlyBelowOne = function(one, two) {
    return one.levelIndex === two.levelIndex - 1 && 
           one.levelConceptCount === two.levelConceptCount && 
           one.levelPosition === two.levelPosition;
}

var isNoJumpRequired = function(one, two) {
    return one.levelIndex === two.levelIndex - 1;
};


var calculateLineTouchPoint = function(start_x, end_x, width, drawnCount, totalCount) {
    
    if(totalCount === 1) {
        return (start_x + end_x) / 2;
    }
    
    else {
        var direction = drawnCount % 2 === 0 ? -1 : 1;
        var divisionUnit = width/(totalCount + 1);
        var directionCount = Math.floor(drawnCount / 2);
        var offset = direction * divisionUnit * (directionCount+1);
        return (start_x + end_x)/2 + offset*0.85;
    }
};


var preprocessEdgesForEaseOfDrawing = function(graph, allNodes, edges, allAlleys) {

    var levelConceptCounts = {};
    var edgesBetweenLevelsCount = {};
    var nodesByFromCount = {}; //todo -> change from and to -> start and end
    var nodesByToCount = {};

    var levelGapTraffic = {};
    var levelAlleyTraffic = {};

    var i, length;
    length = graph.levels.length;

    for(i = 0; i < length; i++) {
        var level = graph.levels[i];
        levelConceptCounts[i] = level.length;
    };
    console.info("levelConceptCounts", levelConceptCounts);

    _.each(edges, function(e) {

        var outCount = nodesByFromCount[e.from] || 0;
        nodesByFromCount[e.from] = outCount + 1;

        var inCount = nodesByToCount[e.to] || 0;
        nodesByToCount[e.to] = inCount + 1;

        e.fromLevelIndex = allNodes[e.from].levelIndex;
        e.toLevelIndex = allNodes[e.to].levelIndex;

        var key = e.fromLevelIndex + "-" + e.toLevelIndex;
        var count = edgesBetweenLevelsCount[key] || 0;
        count += 1;
        edgesBetweenLevelsCount[key] = count;

        var levelsCrossed = [];
        for(var k = e.fromLevelIndex; k <= e.toLevelIndex; k++) {
            levelsCrossed.push(k);
        };
        var crossLength = levelsCrossed.length;
        for(var j = 0; j < crossLength - 1; j++) {
            var trafficKey = levelsCrossed[j] + "-" + levelsCrossed[j+1];
            var levelTrafficCount = levelGapTraffic[trafficKey] || 0;
            levelTrafficCount += 1;
            levelGapTraffic[trafficKey] = levelTrafficCount;
        }

        var isEqualPosition = allNodes[e.from].levelPosition === allNodes[e.to].levelPosition;
        var doLevelsHaveEqualConceptCounts = levelConceptCounts[e.fromLevelIndex] === levelConceptCounts[e.toLevelIndex];

        if( (e.toLevelIndex - e.fromLevelIndex) > 1 ) {
            e.type = app.JUMP;
        }
        else if(isEqualPosition && doLevelsHaveEqualConceptCounts) {
            e.type = app.NO_JUMP_CRISS_CROSS;
        }
        else {
            e.type = app.NO_JUMP_CRISS_CROSS;
        }

        if(e.type === app.JUMP) {
            console.debug(e.from, " at Level ", e.fromLevelIndex , " ----> ", e.to, " at Level ", e.toLevelIndex);
            var viaAlleys = [];
            for(var m = e.fromLevelIndex + 1; m <= e.toLevelIndex-1; m++) {

                var levelAlleys = allAlleys[m];
                var minAlleyIndex = 0;
                var levelAlleysLength = levelAlleys.length;
                for(var n = 1; n < levelAlleysLength; n++) {
                    var alley = levelAlleys[n];
                    minAlleyIndex = levelAlleys[minAlleyIndex].totalCount <= alley.totalCount ? minAlleyIndex : n;
                }
                levelAlleys[minAlleyIndex].totalCount += 1;
                viaAlleys.push(levelAlleys[minAlleyIndex]);
            }
            e.viaAlleys = viaAlleys;
        }

    });

    return {
        edgesBetweenLevelsCount: edgesBetweenLevelsCount,
        edges: edges,
        nodesByFromCount: nodesByFromCount,
        nodesByToCount: nodesByToCount,
        levelGapTraffic: levelGapTraffic    
    };

};


var drawNoJumpPathBetweenOneAndTwo = function(one, two, drawnCount, totalCount, svg) {
    /*
                                                                
                                |
         _______________________|
        |
        |

    */

    console.info("Out count: ", one.outCount);


    var positions = new Array(totalCount);
    for(var i = 0; i < totalCount; i++) {
        positions[i] = 0.85 * app.levelGap*(i + 1) / (totalCount + 1)
    };

    var gap = positions[drawnCount];

    console.info("Gap", gap, one, two);

    var stroke = getLineColor(drawnCount);

    console.info("Stroke", stroke);

    var x1 = calculateLineTouchPoint(one.x, one.x + one.width, two.width, one.drawnOutEdges, one.outCount);
    one.drawnOutEdges += 1;
    var x2 = calculateLineTouchPoint(two.x, two.x + two.width, two.width, two.drawnInEdges, two.inCount);
    two.drawnInEdges += 1;

    var oneToLevelGapLineAttrs = {
        x1: x1,
        y1: one.y + one.height,
        x2: x1,
        y2: one.y + one.height + gap,
        stroke: stroke,
        "stroke-width": app.STROKE_WIDTH
    };
    drawLine(oneToLevelGapLineAttrs, svg);

    var horizontalLineAttrs = {
        x1: oneToLevelGapLineAttrs.x2,
        y1: oneToLevelGapLineAttrs.y2,
        x2: x2,
        y2: oneToLevelGapLineAttrs.y2,
        stroke: stroke,
        "stroke-width": app.STROKE_WIDTH
    };
    drawLine(horizontalLineAttrs, svg); 

    var verticalLineAttrs = {
        x1: x2,
        y1: horizontalLineAttrs.y2,
        x2: x2,
        y2: two.y - 15,
        stroke: stroke,
        "stroke-width": app.STROKE_WIDTH,
        "marker-end": "url(#Triangle)"
    };

    drawLine(verticalLineAttrs, svg);
};

var drawPathInLevelGap = function(x1, y1, x2, y2, startLevelIndex, endLevelIndex, 
                                  totalLevelGapTraffic, drawnLevelGapTraffic, color, marker, svg) {

    var stroke = color;

    var key = startLevelIndex + "-" + endLevelIndex;
    var drawnCount = drawnLevelGapTraffic[key] || 0;
    var totalCount = totalLevelGapTraffic[key];


    //#todo -> DRY 0.85 and the division unit logic.
    var divisionUnit = 0.85 * app.levelGap/(totalCount + 1);
    var offset = divisionUnit * (drawnCount + 1);
    drawnLevelGapTraffic[key] += 1;

    var startVertical_y2 = y1 + offset;

    var startVerticalLineAttrs = {
        x1: x1,
        y1: y1,
        x2: x1,
        y2: startVertical_y2,
        stroke: stroke,
        "stroke-width": app.STROKE_WIDTH

    };

    var middleHorizontalLineAttrs = {
        x1: startVerticalLineAttrs.x2,
        y1: startVerticalLineAttrs.y2,
        x2: x2,
        y2: startVerticalLineAttrs.y2,
        stroke: stroke,
        "stroke-width": app.STROKE_WIDTH
    };

    var endVerticalLineAttrs = {
        x1: middleHorizontalLineAttrs.x2,
        y1: middleHorizontalLineAttrs.y2,
        x2: x2,
        y2: y2,
        stroke: stroke,
        "stroke-width": app.STROKE_WIDTH
    };

    if(marker) {
        endVerticalLineAttrs["marker-end"] = "url(#Triangle)";
        endVerticalLineAttrs.y2 -= 15;
    }

    drawLine(startVerticalLineAttrs, svg);
    drawLine(middleHorizontalLineAttrs, svg);
    drawLine(endVerticalLineAttrs, svg);

}

var getLineColor = function(drawnCount) {
    //http://stackoverflow.com/a/57805/817277. Thank you.
    var whiteHex = parseInt("FFFFFF", 16);
    var max = Math.floor(whiteHex / 3);
    var decimalStroke = Math.floor(max / (drawnCount + 1));

    var strokeString = decimalStroke.toString(16);
    if(strokeString.length < 6) {
        for(var k = 0; k < (6 - strokeString.length); k++) {
            var c = Math.random().toString().charAt(3)
            strokeString += c; //some arbitrary blue component; 
        }
    }
    var stroke = "#" + strokeString;
    return stroke;
};

var drawJumpPathBetweenOneAndTwo = function(one, two, edge, totalLevelGapTraffic, drawnLevelGapTraffic, edgeIndex, svg) {
    /*
                                |
         _______________________|
        |
        |
        |
        |
        -----------------
                        |
                        |
                        |
    */

    var alleys = edge.viaAlleys;

    var color = getLineColor(edgeIndex);


    // -------- Path from one to first alley ----------------- //
    var startAlley = alleys[0];
    var endTouch = calculateLineTouchPoint(startAlley.start_x, startAlley.end_x, 
                                            startAlley.end_x - startAlley.start_x, 
                                            startAlley.drawnCount, startAlley.totalCount);


    var startTouch = calculateLineTouchPoint(one.x, one.x + one.width, one.width, one.drawnOutEdges, one.outCount);
    one.drawnOutEdges += 1;

    drawPathInLevelGap(startTouch, one.y+one.height, endTouch, startAlley.start_y, one.levelIndex, startAlley.levelIndex, 
                                      totalLevelGapTraffic, drawnLevelGapTraffic, color, false, svg);


    // -------- Lines inside each alley ----------------- //
    _.each(alleys, function(a) {
        var touch = calculateLineTouchPoint(a.start_x, a.end_x, a.end_x - a.start_x, a.drawnCount, a.totalCount);
        var insideAlleyLine = {
            x1: touch,
            y1: a.start_y,
            x2: touch,
            y2: a.end_y,
            stroke: color,
            "stroke-width": app.STROKE_WIDTH
        };
        drawLine(insideAlleyLine, svg);
    });

    // -------- Paths between intermediate levels ----------------- //
    var i, length = alleys.length;
    for(i = 0; i < length-1; i++) {

        var s = alleys[i];
        var e = alleys[i+1]

        var startTouch = calculateLineTouchPoint(s.start_x, s.end_x, s.end_x - s.start_x, s.drawnCount, s.totalCount);
        
        var endTouch = calculateLineTouchPoint(e.start_x, e.end_x, e.end_x - e.start_x, e.drawnCount, e.totalCount);

        drawPathInLevelGap(startTouch, s.end_y, endTouch, e.start_y, s.levelIndex, e.levelIndex, 
                                          totalLevelGapTraffic, drawnLevelGapTraffic, color, false, svg);
    }


    // -------- Final Path from last alley to two ----------------- //
    var lastAlley = alleys[length-1];
    var startTouch = calculateLineTouchPoint(lastAlley.start_x, lastAlley.end_x, 
                                            lastAlley.end_x - lastAlley.start_x, 
                                            lastAlley.drawnCount, lastAlley.totalCount);
    

    var endTouch = calculateLineTouchPoint(two.x, two.x + two.width, two.width, two.drawnInEdges, two.inCount);
    drawPathInLevelGap(startTouch, lastAlley.end_y, endTouch, two.y, lastAlley.levelIndex, two.levelIndex, 
                                      totalLevelGapTraffic, drawnLevelGapTraffic, color, true, svg);
    two.drawnInEdges += 1;

    // ---------- Bookkeeping //
    _.each(alleys, function(a) {
        a.drawnCount += 1;
    });
    
    console.table(edge.viaAlleys);
}

var drawAllEdges = function(graph, inputEdges, allNodes, allAlleys, svg) {
    console.info("Edges: ", inputEdges);

    var preprocessResult = preprocessEdgesForEaseOfDrawing(graph, allNodes, inputEdges, allAlleys);
    var edges = preprocessResult.edges;
    var edgesBetweenLevelsCount = preprocessResult.edgesBetweenLevelsCount;
    var nodesByFromCount = preprocessResult.nodesByFromCount;
    var nodesByToCount = preprocessResult.nodesByToCount;

    var totalLevelGapTraffic = preprocessResult.levelGapTraffic;
    var drawnLevelGapTraffic = {};
    _.each(_.keys(totalLevelGapTraffic), function(key) {
        drawnLevelGapTraffic[key] = 0;
    });

    console.info(edges, edgesBetweenLevelsCount);

    console.info("Traffic levels. Where is Silk Board? ", totalLevelGapTraffic);
        
    var i, length;
    length = edges.length;
    var drawnEdgesBetweenLevelsCount = {};
    for(i = 0; i < length; i++) {
        var edge = edges[i];
        var one = allNodes[edge.from];
        var two = allNodes[edge.to];
        one.outCount = nodesByFromCount[edge.from];
        two.inCount = nodesByToCount[edge.to];

        if(edge.type === app.NO_JUMP_CRISS_CROSS) {
            //#todo -> DRY the key
            
            var key = edge.fromLevelIndex + "-" + edge.toLevelIndex;
            var totalCount = totalLevelGapTraffic[key];
            var drawnCount = drawnLevelGapTraffic[key];
            drawNoJumpPathBetweenOneAndTwo(one, two, drawnCount, totalCount, svg);
            drawnCount += 1;
            drawnLevelGapTraffic[key] = drawnCount;
        }

        else if(edge.type === app.JUMP) {
            drawJumpPathBetweenOneAndTwo(one, two, edge, totalLevelGapTraffic, drawnLevelGapTraffic, i, svg)      
        }
    }
};

var drawAllNodes = function(levels, svgAttrs, showProgress) {

    var i, length;
    length = levels.length;

    //#todo -> find a way to do dependency injection for levelGap instead of using global variable
    //As of now I'm trying to minimize usage of global variable by making a local copy 
    //and using the local variable everywhere else in this function, at least. 
    var levelGap = app.levelGap;
    var cumulativeLevelHeight = app.LevelZeroGap;

    var allNodes = {};
    var allAlleys = [];
    for(i = 0 ; i < length; i++) {
        var level = levels[i];
        var levelAttrs = drawLevelNodes(level, i, svgAttrs, cumulativeLevelHeight, showProgress);
        _.extend(allNodes, levelAttrs.levelNodes);
        var maxLevelHeight = levelAttrs.maxHeight;
        cumulativeLevelHeight = cumulativeLevelHeight + maxLevelHeight + levelGap;
        allAlleys.push(levelAttrs.alleys);
    };
    return {
        allNodes: allNodes,
        allAlleys: allAlleys
    };
};


var init = function(svg, graph, showProgress) {
    

    svg.find("foreignObject").remove();
    svg.find("line").remove();


    var svgAttrs = {
        svg: svg,
        width: svg.attr("width")
    };

    var result = drawAllNodes(graph.levels, svgAttrs, showProgress);
    drawAllEdges(graph, graph.edges, result.allNodes, result.allAlleys, svg);

    // if(showProgress) {
    //     setTimeout(function() {
    //         _.each(result.allNodes, function(n) {
    //             n.p.find(".progress-bar").addClass("determinate");
    //         });
    //     }, 500);

    // }

    return result.allNodes;
};

var render = function(options) {
    app.view = new GraphView(options);
    return app.view;
}

var unmount = function() {
    if(app.view) {
        app.view.remove();   
    }
    app.view = null;
}

var TRIANGLE_MARKER =   '<defs> '                                   +
                            '<marker id="Triangle" '                +
                                    'viewBox="0 0 10 10" '          +
                                    'refX="0" refY="5" '            +
                                    'markerWidth="5" '              +
                                    'markerHeight="5" '             +
                                    'orient="auto"> '               +
                                '<path d="M0,0 L10,5 L0,10 z" /> '  +
                            '</marker> '                            +
                        '</defs> '                                  ;

var GraphView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options;
        this.showProgress = options.showProgress || false;
        this.activeNode = null;
    },

    render: function(graph) {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg = $(this.svg);
        this.svg.attr({
            width: this.options.width,
            height: "1800"
        });
        this.svg[0].innerHTML = TRIANGLE_MARKER;
        this.$el.append(this.svg);
        this.allNodes = init(this.svg, graph, this.showProgress);
        window.graphView = this;
        return this;
    },

    refresh: function(graph) {
        this.allNodes = init(this.svg, graph, this.showProgress);
        return this;
    },

    highlightNode: function(id) {
        this.tonedownActiveNode();
        this.activeNode = this.allNodes[id];
        this.activeNode.el.addClass("concept-box-active");
        this.activeNode.el.parent().addClass("concept-box-active");
        return this;
    },

    tonedownActiveNode: function() {
        if(this.activeNode) {
            this.activeNode.el.removeClass("concept-box-active");
            this.activeNode.el.parent().removeClass("concept-box-active");
            this.activeNode = null;
        }
        return this;
    }

});

module.exports = {
    render: render,
    unmount: unmount
}
