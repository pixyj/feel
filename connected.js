"use strict";

var app = {
    levelGap: 50,
    ns: 'http://www.w3.org/2000/svg'
}

var graph = {

    levels: [

    [
        {
            name: "Gram Schmidt",
            chapterIndex: 1,
            id: 7
        },

        {
            name: "Gram Schmidt",
            chapterIndex: 1,
            id: 8
        },

        {
            name: "Gram Schmidt",
            chapterIndex: 1,
            id: 9
        },

        {
            name: "Gram Schmidt",
            chapterIndex: 1,
            id: 10
        },

        {
            name: "Gram Schmidt",
            chapterIndex: 1,
            id: 11
        }
    ],

                [
                    {
                        name: "Projection of a vector on another",
                        chapterIndex: 1,
                        id: 1
                    }
                ],

                [
                    {
                        name: "Projection of a vector on a subspace",
                        chapterIndex: 1,
                        id: 2
                    },
                    {
                        name: "Least Squares.",
                        chapterIndex: 1,
                        id: 3
                    }
                ],

                [
                    {
                        name: "Projection of a vector on a subspace",
                        chapterIndex: 1,
                        id: 4
                    },
                    {
                        name: "Least Squares.",
                        chapterIndex: 1,
                        id: 5
                    }
                ],

                [
                    {
                        name: "Gram Schmidt",
                        chapterIndex: 1,
                        id: 6
                    }
                ]
    ],

    edges: [
        {
            from: 2,
            to: 4
        },
        {
            from: 1,
            to: 6
        }
    ]
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
    console.log("Circle", attrs);
    svg.append(circle);
};

var getForeignObjectAttrs = function(levelIndex, position, levelConceptCount, levelWidth, levelHeight) {

    var leftPadding, rightPadding; 
    var paddingFraction = 0.05;
    //5% padding each side
    leftPadding = rightPadding = Math.floor(levelWidth * paddingFraction / 2); 
    
    var payloadWidth = Math.floor(levelWidth * (1 - paddingFraction));
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

var drawNode = function(node, levelIndex, position, levelConceptCount, svgAttrs, levelHeight) {
    
    var svg = svgAttrs.svg;
    var svgWidth = svgAttrs.width;

    var chapterClass = "chapter-box-" + node.chapterIndex;
    var h4 = $("<h4>").html(node.name);
    var p = $("<p>").addClass("concept-box").addClass(chapterClass).append(h4);

    //foreignObject does not work on IE #todo. But my initial technical audience does not use IE, I guess? 
    //And making aligning svg text is a pain
    var attrs = getForeignObjectAttrs(levelIndex, position, levelConceptCount, svgWidth, levelHeight);
    var f = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    console.log("Node", attrs, node, " at level ", levelIndex, " in position", position);


    f = $(f).append(p).attr(attrs);
    svg.append(f);
    var height = p.height();
    f.attr("height", height); //for safari

    return {
        height: height,
        arrowEntry_x: Math.floor( (attrs.x*2 + attrs.width)/2 ),
        arrowEntry_y: Math.floor( (attrs.y - app.levelGap/2) ),
        x: attrs.x,
        y: attrs.y,
        node: f,
        p: p,
        levelIndex: levelIndex,
        levelConceptCount: levelConceptCount,
        levelPosition: position
    };
};

var drawLevelNodes = function(level, levelIndex, svgAttrs, levelHeight) {

    var i, length;
    length = level.length;


    var maxHeight = 0;
    var levelNodes = {};
    for(i = 0; i < length; i++) {
        var node = level[i];
        var nodeAttrs = drawNode(node, levelIndex, i, length, svgAttrs, levelHeight);
        levelNodes[node.id] = nodeAttrs
        var height = nodeAttrs.height;
        maxHeight = _.max([maxHeight, height]);
        drawArrowEntry(nodeAttrs, svgAttrs.svg);
    }
    console.log("Max height at level ", levelIndex, " is ", maxHeight);
    console.log("-----------------------   End of level ", levelIndex,  "-------------------------------");

    _.each(levelNodes, function(n) {
        n.p.css("height", maxHeight);
    });

    return {
        levelNodes: levelNodes,
        maxHeight: maxHeight
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
        "stroke-width": 3,
        "marker-end": "url(#Triangle)"
    };
    drawLine(attrs, svg);
}   


var isTwoDirectlyBelowOne = function(one, two) {
    return one.levelIndex === two.levelIndex - 1 && 
           one.levelConceptCount === two.levelConceptCount && 
           one.levelPosition === two.levelPosition;
}

var drawAllEdges = function(edges, allNodes, svg) {
    console.info("Edges: ", edges);

    var i, length;
    length = edges.length;
    for(i = 0; i < length; i++) {
        var edge = edges[i];
        var one = allNodes[edge.from];
        var two = allNodes[edge.to];

        if(isTwoDirectlyBelowOne(one, two)) {
            var lineAttrs = {
                x1: one.arrowEntry_x,
                y1: one.y + one.height,
                x2: two.arrowEntry_x,
                y2: two.y - 15,
                stroke: "black",
                "stroke-width": 3,
                "marker-end": "url(#Triangle)"
            };
            drawLine(lineAttrs, svg);    
        };
        
    }
};

var drawAllNodes = function(levels, svgAttrs) {

    var i, length;
    length = levels.length;

    //#todo -> find a way to do dependency injection for levelGap instead of using global variable
    //As of now I'm trying to minimize usage of global variable by making a local copy 
    //and using the local variable everywhere else in this function, at least. 
    var levelGap = app.levelGap;
    var cumulativeLevelHeight = levelGap;

    var allNodes = {};
    for(i = 0 ; i < length; i++) {
        var level = levels[i];
        var levelNodesAndMaxHeight = drawLevelNodes(level, i, svgAttrs, cumulativeLevelHeight);
        _.extend(allNodes, levelNodesAndMaxHeight.levelNodes);
        var maxLevelHeight = levelNodesAndMaxHeight.maxHeight;
        cumulativeLevelHeight = cumulativeLevelHeight + maxLevelHeight + levelGap;
    };
    return allNodes;
};


var init = function() {
    
    //cache the width so that it can used be in calculations without querying the dom each time.
    var svg = $("svg");
    
    svg.find("foreignObject").remove();
    svg.find("line").remove();


    var svgAttrs = {
        svg: svg,
        width: svg[0].offsetWidth
    };

    app.allNodes = drawAllNodes(graph.levels, svgAttrs);
    drawAllEdges(graph.edges, app.allNodes, svg);

    //testDrawLine(svg);
};


$(document).ready(init);

//window.onresize = init;

