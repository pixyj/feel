var S = require("sylvester");

var $ = require("jquery");
var _ = require("underscore");

var Backbone = require("backbone");

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



    var round = function(i, c) {
        return parseFloat((i*c).toFixed(2))
        
    };
    var a = new Array();

    for(i = step; i <= r; i+=step) {
        for(j = 0; j <= 360; j += angle) {
            theta = j * Math.PI / 180;
            //console.log(j, theta);
            x = round(i, Math.cos(theta));
            y = round(i, Math.sin(theta));
            //var dist = x*x + y*y;
            //console.info(i, j, x, y, dist);
            a.push([x, y]);
        }
    }
    return a;
}

var SvgView = Backbone.View.extend({

    
    initialize: function(options) {

        this.options = options;

        if(this.options.renderOnResize) {
            this.listenToResizeEvent();
            this._pointsCopy = options.points.slice();
        }
        var svg = document.createElementNS(app.ns, "svg");


        this.svg = $(svg).attr({
            height: options.width,
            width: options.width,
            xmlns: "http://www.w3.org/2000/svg",
            version: "1.1"
        });
        this.$el.append(this.svg);
    },

    render: function() {
        this.renderPoints(this.options.points);
        this.renderAxes();
        return this;
    },

    reset: function() {
        this.svg.empty();
        this.svg.$width = 0;
        this.svg.$height = 0;
        this.options.points = this._pointsCopy.slice();
    },

    renderPoints: function(points) {

        var svg = this.svg;
        svg.$width = svg.$width || this.options.parent.width();
        svg.$height = svg.$width; //height same as width for now.

        var center = {
            0: svg.$width / 2,
            1: svg.$height / 2
        };

        this.center = center;

        this.normalizePoints(points);

        var shiftPoint = function(point) {
            var x =  parseFloat( (point[0] + center[0]).toFixed(2) );
            var y =  parseFloat( (-point[1] + center[1]).toFixed(2) );
            return [x, y];
        };
        mapPointsInPlace(points, [shiftPoint]);

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

        if(this.options.timeout) {
            var length = points.length;
            for(var i = 0; i < length; i++) {
                var gap = this.options.timeout;
                var x = function(j) {
                    setTimeout(function() {
                        renderCircle(points[j]);
                    }, j*gap);
                }(i);
            }
        }
        else {
            mapPointsInPlace(points, [renderCircle]);
        }

    },

    getColor: function(point) {
        var lastColor = 0xAfAfAf;
        var x = point[0];
        var y = point[1];
        var mag = Math.sqrt(x*x + y*y);
        //console.log(mag, point);

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

    drawLine: function(attrs) {
        var line = document.createElementNS(app.ns, 'line');
        _.each(_.keys(attrs), function(key) {
            line.setAttribute(key, attrs[key]);
        });

        this.svg.append(line);
    },

    absMax: function(point) {
        return _.max([Math.abs(point[0]), Math.abs(point[1])])
    },

    normalizePoints: function(points) {
        var max = this.absMax(points[0]);

        var length = points.length;
        for(var i = 1; i < length; i++) {
            max = this.absMax([max, this.absMax(points[i])]);
        };

        // if(max < (this.svg.$width/2) ){
        //     return;
        // }

        var scaleComponent = function(value, maxValue, svgWidth) {
            return 0.95 * (svgWidth/2) * (value / maxValue)
        }
        for(var j = 0; j < length; j++) {
            points[j][0] = scaleComponent(points[j][0], max, this.svg.$width);
            points[j][1] = scaleComponent(points[j][1], max, this.svg.$width);
        }
    },

    renderAxes: function() {
        if(!this.options.renderAxes) {
            return;
        }

        this.cx = this.center[0];
        this.cy = this.center[1];


        var commonAttrs = {
            stroke: "red"
        };
        var xAxisAttrs = _.extend({
            x1: 0,
            y1: this.cy,
            x2: this.options.width,
            y2: this.cy,
        }, commonAttrs);
        var yAxisAttrs = _.extend({
            x1: this.cx,
            y1: 0,
            x2: this.cx,
            y2: this.options.height
        }, commonAttrs);
        this.drawLine(xAxisAttrs);
        this.drawLine(yAxisAttrs);

    },

    onResize: function() {
        console.log("onResize");
        this.reset();
        this.render();
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

});

var SvgGridView = Backbone.View.extend({
    
    initialize: function(options) {

        this.options = options;
        this.length = options.plots.length;

        

    },

    render: function() {

        var container = this.$el.addClass("container");
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

            var column = $("<div>").addClass("col-xs-12 col-md-6");
            row.append(column);


            var svgOptions = _.extend(this.options, {
                points: this.options.plots[i],
                parent: column,
                width: column.width()
            });


            var svgView = new SvgView(svgOptions).render();
            column.append(svgView.$el);
        }

        return this;
    }

});





var render = function() {
    console.log("hi there sylvester");

    var svg = $("svg");
    
    var input    

    var a = range(-5, 5, 0.2);
    var axb = cartesianProduct(a, a);
    //var axb = concentricCircles(200, 5, 5);

    //console.table(axb);
    var m = [[0.7071, 0.7071], [0.2, 0.7071]]
    var two = $M(axb);
    var one = $M(m);
    var one_inverse = one.inverse();
    var result = two.multiply(one).elements;
    var three = two.multiply(one_inverse).elements;
    
    var gridView = new SvgGridView({
        height: 600,
        renderAxes: true,
        plots: [two.elements, result, three, [[10, 10]]],
        maxPlotsPerRow: 2,
        timeout: 0,
        renderOnResize: false
    });

    $("#svg-container").append(gridView.$el);

    gridView.render();

    window.S = S;
    window.axb = axb;
    //console.table(result);
}


module.exports = {
    render: render
}