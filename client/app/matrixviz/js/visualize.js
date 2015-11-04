var S = require("sylvester");

var $ = require("jquery");
var _ = require("underscore");

var mapPointsInPlace = function(points, fnArray) {
    var length = points.length;

    var fnArrayLength = fnArrayLength.length;
    for(var i = 0; i < length; i++) {
        var x = points[i][0];
        var y = points[i][1];
        var p = [x, y];
        for(var j = 0; j < fnArrayLength; j++) {
            p[0] = fnArray[j][0](p, 0);
            p[1] = fnArray[j][1](p, 1);
        }
        points[i][0] = x;
        points[i][1] = y;
    }
    return points;
};

var toSvgCoordinates = function(width, height, max_x, max_y, digits) {

    digits = digits || 2;

    var transformRatios = {
        0: width / max_x,
        1: width / max_y
    };

    var transformPoint = function(point, index) {
        return (transformRatios[index] * point[index]).toFixed(digits);
    };

    var toSvg = function(points) {
        return mapPointsInPlace(points, [transformPoint, transformPoint]);
    }

    return toSvg;
};

var renderPoints = function(svg, points, svgPoints) {
    
}



var app = {
    ns: 'http://www.w3.org/2000/svg'
};

var drawCircle = function(attrs, svg) {
    var circle = document.createElementNS(app.ns, 'circle');

    _.each(_.keys(attrs), function(key) {
        circle.setAttribute(key, attrs[key]);
    });
    
    svg.append(circle);    
};

var range = function(start, end, step) {

    step = step || 1;
    var length = Math.floor( (end - start) / step );

    var a = new Array(length);
    for(var i = 0; i < length; i++) {
        a[i] = start + i * step;
    }
    return a;
};

var cartesianProduct = function(a, b) {

    var a_length = a.length;
    var b_length = b.length;

    var axb = new Array(a_length*b_length);

    for(var i = 0; i < a_length; i++) {
        for(var j = 0; j < b_length; j++) {
            axb[i * a_length + j] = [a[i], b[j]];
        }
    }
    return axb;
};


var concentricCircles = function(cx, cy, r, step, angle) {

    step = step || 1;
    var i, j, x, y, theta;

    var a = new Array();
    for(i = step; i <= r; i+=step) {
        for(j = 0; j <= 360; j += angle) {
            theta = j * Math.PI / 180;
            //console.log(j, theta);
            x = i * Math.cos(theta);
            y = i * Math.sin(theta);
            a.push([x + cx, y + cy]);
        }
    }
    return a;
}

var render = function() {
    console.log("hi there sylvester");

    var svg = $("svg");
    
    var input    

    var attrs = {
        r: 2,
        "stroke-width": 3,
        stroke: 3
    };
    
    var a = range(0, 5, 0.2);
    //var axb = cartesianProduct(a, a);
    var axb = concentricCircles(200, 200, 200, 20, 10);

    console.table(axb);
    var m = [[0.5, 0.1], [0.2, 0.8]]
    var two = $M(axb);
    var one = $M(m);
    var one_inverse = one.inverse();
    var result = two.multiply(one).elements;
    var secondResult = two.multiply(one_inverse).elements;
    var length = axb.length;

    var lastColor = 0x7f7f7f;


    for(var i = 0; i < length; i++) {
        var colorIndex = Math.floor(i * lastColor / length);
        var stringColorIndex = colorIndex.toString(16);
        var s = stringColorIndex.length;
        var c = String(stringColorIndex);
        for(var j = 6; j > s; j--) {
            stringColorIndex = stringColorIndex + "0";
        }
        //console.log(i, c, stringColorIndex);
        var color = "#" + stringColorIndex;
        var center = {
            cx: axb[i][0] + 30,
            cy: axb[i][1] + 30,
            fill: color
        };
        var circleAttrs = _.extend(center, attrs);
        
        var c = {
            cx: result[i][0] + 500,
            cy: result[i][1] + 30,
            fill: color
        };
        c = _.extend(c, attrs);

        var d = {
            cx: secondResult[i][0] + 1000,
            cy: secondResult[i][1] + 30,
            fill: color
        };
        d = _.extend(d, attrs);

        draw([circleAttrs, c], svg, i);

    }


    window.S = S;
    window.axb = axb;
    console.table(result);
}

var draw = function(points, svg, i) {

    setTimeout(function() {
        for(var j = 0; j < points.length; j++) {
            drawCircle(points[j], svg);
        }
    }, i*20);

}

module.exports = {
    render: render
}