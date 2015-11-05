var S = require("sylvester");

var $ = require("jquery");
var _ = require("underscore");

var mapPointsInPlace = function(points, fnArray) {
    var length = points.length;

    var fnArrayLength = fnArray.length;
    for(var i = 0; i < length; i++) {
        var x = points[i][0];
        var y = points[i][1];
        for(var j = 0; j < fnArrayLength; j++) {
            points[i] = fnArray[j](points[i]);
        }

    }
    return points;
};

var app = {
    ns: 'http://www.w3.org/2000/svg'
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


var concentricCircles = function(r, step, angle) {

    step = step || 1;
    var i, j, x, y, theta;

    var a = new Array();
    for(i = step; i <= r; i+=step) {
        for(j = 0; j <= 360; j += angle) {
            theta = j * Math.PI / 180;
            //console.log(j, theta);
            x = i * Math.cos(theta);
            y = i * Math.sin(theta);
            a.push([x, y]);
        }
    }
    return a;
}


var SvgView = function(options) {

    this.options = options;

    var svg = document.createElementNS(app.ns, "svg");
    this.svg = $(svg).attr({
        height: options.height,
        width: options.width,
        xmlns: "http://www.w3.org/2000/svg",
        version: "1.1"
    });
    
    options.parent.append(this.svg);

    if(this.renderOnResize) {
        this.listenToResizeEvent();
    }
};

SvgView.prototype = {

    render: function() {
        this.renderPoints(this.options.points);
        return this;
    },

    renderPoints: function(points) {

        var svg = this.svg;
        svg.$width = svg.$width || svg.width();
        svg.$height = svg.$height || svg.height();

        var center = {
            0: svg.$width / 2,
            1: svg.$height / 2
        };

        center = {
            0: 200,
            1: 200
        };

        var shiftPoint = function(point) {
            var x =  parseFloat( (point[0] + center[0]).toFixed(2) );
            var y =  parseFloat( (point[1] + center[1]).toFixed(2) );
            return [x, y];
        };

        var self = this;
        var renderCircle = function(point) {
            var attrs = {
                cx: point[0],
                cy: point[1],
                r: 3,
                fill: self.getColor(point)
            };
            self.drawCircle(attrs);
            return point;
        };

        mapPointsInPlace(points, [shiftPoint, renderCircle]);


    },

    getColor: function(point) {
        var lastColor = 0xAfAfAf;
        var x = point[0];
        var y = point[1];
        var mag = Math.sqrt(x*x + y*y);
        console.log(mag, point);

        var stringColor = Math.floor((mag*lastColor / 20)).toString(16);
        var length = stringColor.length;
        for(j = 6; j > length; j--) {
            stringColor = j + stringColor;
        };
        if(length > 6) {
            stringColor = stringColor.slice(0, 6);
        }
        stringColor = "#" + stringColor;
        return stringColor;
    },

    drawCircle: function(attrs) {
        var circle = document.createElementNS(app.ns, 'circle');

        _.each(_.keys(attrs), function(key) {
            circle.setAttribute(key, attrs[key]);
        });
        
        this.svg.append(circle);    
    },

    normalizePoints: function() {

    },

    renderAxes: function() {
        if(!this.options.renderAxes) {
            return;
        }
    },



    onResize: function() {
        this.allPoints.forEach(function(p) {
            this.svg.empty();
            this.renderAxes();
            this.renderPoints(p);
        }, this);
    },

    listenToResizeEvent: function() {
        var self = this;
        $(window).on("resize", function() {
            self.onResize();
        });
    },

    stopListeningToResizeEvent: function() {
        $(window).off("resize", this.listenToResizeEvent);
    }
};

SvgView.prototype.constructor = SvgView;

var SvgGridView = function(options) {

    this.options = options;
    this.length = options.plots.length;

};

SvgGridView.prototype = {
    render: function() {

        var container = $("<div>").addClass("container");
        this.options.parent.append(container);
        var row;

        var self = this;
        var isNewRowNeeded = function(i) {
            return (i % self.options.maxPlotsPerRow == 0);
        }

        for(var i = 0; i < this.length; i++) {
            if(isNewRowNeeded(i)) {
                row = $("<div>").addClass("row");
                container.append(row);
            }

            var column = $("<div>").addClass("col-md-6");
            row.append(column);


            var svgOptions = _.extend(this.options, {
                points: this.options.plots[i],
                parent: column,
                width: column.width()
            });


            var svgView = new SvgView(svgOptions).render();

        }
        return this;
    }
};

SvgGridView.prototype.constructor = SvgGridView;


var render = function() {
    console.log("hi there sylvester");

    var svg = $("svg");
    
    var input    

    var a = range(0, 5, 0.2);
    //var axb = cartesianProduct(a, a);
    var axb = concentricCircles(200, 15, 10);

    console.table(axb);
    var m = [[0.5, 0.1], [0.2, 0.8]]
    var two = $M(axb);
    var one = $M(m);
    var one_inverse = one.inverse();
    var result = two.multiply(one).elements;
    var three = two.multiply(one_inverse).elements;
    
    var gridView = new SvgGridView({
        parent: $("#svg-container"),
        height: 600,
        renderAxes: true,
        plots: [result, two.elements, three, result],
        maxPlotsPerRow: 2
    }).render();


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