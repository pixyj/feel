"use strict";

var graph = {

    levels: [
                [
                    {
                        name: "Projection of a vector on a subspace",
                        chapterIndex: 1,
                        id: 1
                    }
                ],

                [
                    {
                        name: "Projection of a vector on a subspace",
                        chapterIndex: 1,
                        id: 4
                    },
                    {
                        name: "Projection of a vector on a subspace. In another's arms. In another's arms. In another's arms.",
                        chapterIndex: 1,
                        id: 4
                    }
                ],

                [
                    {
                        name: "Projection of a vector on a another",
                        chapterIndex: 1,
                        id: 4
                    }
                ]
    ],

    edges: [
        {
            from: 1,
            to: 4
        },
        {
            from: 4,
            to: 8
        }
    ]
};

var getForeignObjectAttrs = function(levelIndex, position, levelConceptCount, levelWidth, levelHeight) {

    var y = levelHeight;

    var nodePlusMarginWidth = levelWidth/levelConceptCount;
    var leftMarginWidth, rightMarginWidth;
    leftMarginWidth = rightMarginWidth = nodePlusMarginWidth*0.2;
    var nodeWidth = nodePlusMarginWidth - leftMarginWidth - rightMarginWidth;

    var x = leftMarginWidth + position*nodePlusMarginWidth;

    var attrs = {
        x: x,
        y: y,
        width: nodeWidth
    };

    return attrs;
};

var drawNode = function(node, levelIndex, position, levelConceptCount, svgAttrs, levelHeight) {
    console.log("Drawing ", node, " at level ", levelIndex, " in position", position);

    var svg = svgAttrs.svg;
    var svgWidth = svgAttrs.width;

    var chapterClass = "chapter-box-" + node.chapterIndex;
    var h4 = $("<h4>").html(node.name);
    var p = $("<p>").addClass("concept-box").addClass(chapterClass).append(h4);

    //foreignObject does not work on IE #todo. But my initial technical audience does not use IE, I guess? 
    //And making aligning svg text is a pain
    var attrs = getForeignObjectAttrs(levelIndex, position, levelConceptCount, svgWidth, levelHeight);
    var f = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')


    f = $(f).append(p).attr(attrs);
    svg.append(f);
    var height = p.height();
    f.attr("height", height); //for safari
    return height;
};

var drawLevelNodes = function(level, levelIndex, svgAttrs, levelHeight) {

    var i, length;
    length = level.length;

    var maxHeight = 0;
    var levelNodes = [];
    for(i = 0; i < length; i++) {
        var node = level[i];
        var height = drawNode(node, levelIndex, i, length, svgAttrs, levelHeight);
        maxHeight = _.max([maxHeight, height]);
    }
    return maxHeight;
};

var drawAllNodes = function(levels, svgAttrs) {

    var i, length;
    length = levels.length;
    var cumulativeLevelHeight = 30;
    for(i = 0 ; i < length; i++) {
        var level = levels[i];
        var maxLevelHeight = drawLevelNodes(level, i, svgAttrs, cumulativeLevelHeight);
        cumulativeLevelHeight = cumulativeLevelHeight + maxLevelHeight + 30;
    }
};


var init = function() {
    
    //cache the width so that it can used be in calculations without querying the dom each time.
    var svg = $("svg");
    svg.empty();
    var svgAttrs = {
        svg: svg,
        width: svg[0].offsetWidth
    }
    drawAllNodes(graph.levels, svgAttrs);
};


$(document).ready(init);

window.onresize = init;

