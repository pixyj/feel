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
            points[i] = fnArray[j](points[i], i);
        }

    }
    return points;
};

var app = {
    ns: 'http://www.w3.org/2000/svg'
};

var getColorsArray = function(length) {

    var colors = new Array(length);
    
    var lastColor = 0xCCCCCC;
    var firstColor = 0x666666;
    var diff = (lastColor - firstColor);

    for(var i = 0; i < length; i++) {
        var color = firstColor + diff * (i / length);
        color = "#" + Math.floor(color).toString(16) 
        //var color = "#" + Math.floor(lastColor * Math.random()).toString(16);
        colors[i] = color;
    }
    return colors;
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

    el: "<div class='card'> </div>",
    
    initialize: function(options) {

        this.options = options;

        if(this.options.renderOnResize) {
            this.listenToResizeEvent();
            this._pointsCopy = options.points.slice();
        }
        this._pointsLength = this.options.points.length * this.options.points[0].length;
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
        var renderCircle = function(point, i) {
            var attrs = {
                cx: point[0],
                cy: point[1],
                r: 3,
                fill: self.getColor(point, i)
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
                        renderCircle(points[j], j);
                    }, j*gap);
                }(i);
            }
        }
        else {
            mapPointsInPlace(points, [renderCircle]);
        }

    },

    getPixelColor: function(point, position) {
        this._p = this.p || 0;
        return app.colors[this._p++];
    },

    getColor: function(point, position) {
        return this.options.colors[position];
    },

    getWtfColor: function(point, position) {
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

        var container = this.$el;
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

// <p class="range-field">
//   <input type="range" id="test5" min="0" max="100" />
// </p>
var RangeView = Backbone.View.extend({

    el: "<p>",

    MIN: 0,
    MAX: 100,

    initialize: function(options) {
        this.options = options;
    },

    render: function() {
        
        var input = $("<input />").attr({
            type: "range",
            min: this.options.min || this.MIN,
            max: this.options.max || this.MAX 
        });


        var thumb = $('<span class="thumb"><span class="value"></span></span>')
        this.$el.addClass("range-field").append(input).append(thumb);
        this.$el.css({
            "margin-top": "30px"
        });
        
        return this;
    }

});

var MatrixInputView = Backbone.View.extend({

    ROWS: 2,
    COLUMNS: 2,

    initialize: function(options) {

        this.options = options;
        if(!this.options.matrix) {
            this.ROWS = options.rows || this.ROWS;
            this.COLUMNS = options.columns || this.COLUMNS;
            this._matrix = new Array(this.ROWS);
            for(var i = 0; i < this.ROWS; i++) {
                this._matrix[i] = Array.apply(null, Array(this.COLUMNS)).map(Number.prototype.valueOf,0);
            }
        }
        else {
            this._matrix = options.matrix;
            this.ROWS = this._matrix.length;
            this.COLUMNS = this._matrix[0].length;
        }

    },

    render: function() {
        this.views = [];

        var table = $("<table>").addClass("matrix-input-table");
        for(var i = 0; i < this.ROWS; i++) {

            var rowViews = [];
            var row = $("<tr>");
            for(var j = 0; j < this.COLUMNS; j++) {

                var input = $("<input>").attr({
                    "type": "number",
                    "value": this._matrix[i][j]
                });
                rowViews.push(input);

                var td = $("<td>").append(input);
                row.append(td);

            }
            table.append(row);
            this.views.push(rowViews);
        }
        this.$el.append(table);
        return this;
    },

    getInputMatrix: function() {

    },

    remove: function() {
        _.each(this.views, function(row) {
            _.each(row, function(v) {
                v.remove();
            });
        });
        this.remove();
    }
});

// var initColors = function() {
//     var elem = document.getElementById("one");
//     context = elem.getContext("2d");
//     context.drawImage(document.getElementById("img"), 0, 0, 10, 10);

//     var imageData = context.getImageData(0, 0, 10, 10);
//     pix = imageData.data;

//     var colors = [];
//     var i, n;
//     for(var i = 0, n = pix.length; i < n; i += 4) {
//         var c = "#";
//         c += pix[i].toString(16);
//         c += pix[i+1].toString(16);
//         c += pix[i+2].toString(16);
//         colors.push(c.toUpperCase());
//     };

//     app.colors = colors;
//     window.colors = colors;
// };

var render = function() {
    //initColors();

    console.log("hi there sylvester");

    var svg = $("svg");
    
    var input    

    var a = range(-5, 5, 0.2);
    //var axb = cartesianProduct(a, a);

    var axb = concentricCircles(200, 5, 5);

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
        colors: getColorsArray(axb.length * axb[0].length),
        maxPlotsPerRow: 2,
        timeout: 0,
        renderOnResize: false
    });

    var inputView = new MatrixInputView({}).render();
    var rangeView = new RangeView({}).render();
    $("#svg-container").append(rangeView.$el).append(inputView.$el).append(gridView.$el);

    gridView.render();

    window.S = S;
    window.axb = axb;
    //console.table(result);
}


module.exports = {
    render: render
}