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

            var column = $("<div>").addClass("col-xs-6");
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

var SpeedView = Backbone.View.extend({

    initialize: function(options) {
        this.options = options;

    },

    SPEEDS: {
        SLOW: 50,
        MEDIUM: 20,
        FAST: 7,
        INSTANT: 0
    },

    render: function() {

        var h4 = $("<h4>").addClass("matrix-options-heading").html("Visualization Speed");
        this.$el.append(h4);

        var speeds = _.keys(this.SPEEDS);

        var length;
        for(var i = 0, length = speeds.length; i < length; i++) {
            var id = "speed-" + speeds[i];
            var input = $("<input />").attr({
                type: "radio",
                id: id,
                name: "speeds",
                value: this.SPEEDS[speeds[i]]
            });
            var label = $("<label>").attr("for", id).html(speeds[i]).addClass("matrix-speed-label");
            var p = $("<p>").append(input).append(label);
            this.$el.append(p);
        }

        this.$el.find("#speed-MEDIUM").attr("checked", true);

        return this;
    },

    getState: function() {
        var val = this.$el.find('input:radio[name=speeds]:checked').val();
        var timeout = parseInt(val);
        return {
            timeout: timeout
        }
    }

});

var MatrixInputView = Backbone.View.extend({

    ROWS: 2,
    COLUMNS: 2,

    el: "<table id='matrix-input-table'> </table>",

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

        this.inputs = new Array(this.ROWS);

        var table = this.$el;

        for(var i = 0; i < this.ROWS; i++) {
            var columnViews = new Array(this.COLUMNS);
            this.inputs[i] = columnViews;
            var tr = $("<tr>");
            for(var j = 0; j < this.COLUMNS; j++) {
                var td = $("<td>");
                var input = $("<input />").attr({
                    type: "number",
                    value: this._matrix[i][j]
                }).css({
                    "border": "none"
                });
                this.inputs[i][j] = input;
                var div = $("<div>").append(input);
                td.append(div);
                this.styleColumn(td, i, j);
                
                tr.append(td);
            }
            table.append(tr);
        }
        //this.$el.append(table);
        this.renderBorders();
        return this;
    },

    renderBorders: function() {

        var top = this.options.top;
        var positions = [
            {
                top: top,
                left: 0,
                "margin-left": "15px"
            },
            {
                top: top,
                right: 0,
                "margin-right": "15px"
            },
            {
                bottom: 0,
                left: 0,
                "margin-left": "15px"
            },
            {
                bottom: 0,
                right: 0,
                "margin-right": "15px"
            }
        ];

        var self = this;
        positions.forEach(function(p) {
            var div = $("<div>").addClass("matrix-input-table-border-div").css(p);
            self.options.parent.append(div);
        });
    },

    styleColumn: function(td, row, column) {

        if(column === 0) {
            td.find("input").css({
                "margin-left": "10%"
            });
        }
        else if( column === (this.COLUMNS - 1) ) {
            td.css({
                "width": "30%"
            });
            td.find("input").css({
                "width": "100%"
            });
        }

    },

    getState: function() {

        var inputs = this.$el.find("input");
        var elements = new Array();
        for(var i = 0; i < this.ROWS; i++) {

            elements[i] = new Array(this.COLUMNS);
            for(var j = 0; j < this.COLUMNS; j++) {
                var val = this.inputs[i][j].val() || 0;
                elements[i][j] = parseFloat(val);
            }
        }

        return {
            transformationMatrix: elements
        };
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

var MatrixShapeOptionsView = Backbone.View.extend({
    

    initialize: function(options) {
        this.options = options;
    },

    render: function() {

        var h4 = $("<h4>").addClass("matrix-options-heading").html("Input Matrix Shape");
        this.$el.append(h4);
        var svg = document.createElementNS(app.ns, "svg");
        svg = $(svg);
        this.$el.append(svg);

        var height = this.options.height - h4.height();
        svg.attr({
            "width": this.options.width,
            "height": height
        });
        
        var size = _.min([this.options.width, height]);

        var circle = document.createElementNS(app.ns, "circle");
        circle = $(circle);
        var r = size * 0.25;

        circle.attr({
            "cx": r + 4,
            "cy": r + 4,
            "r": r,
            "stroke": "black",
            "stroke-width": "3",
            "fill": "none",
            "class": "matrix-input-shape"
        });


        var rect = document.createElementNS(app.ns, "rect");
        rect = $(rect);
        rect.attr({
            "x": this.options.width - 2*r - 4,
            "y": 4,
            "height": r*2,
            "width": r*2,
            "stroke": "black",
            "stroke-width": "3",
            "fill": "none",
            "class": "matrix-input-shape"
        });

        svg.append(circle).append(rect);

        this.circle = circle;
        this.rect = rect;
        
        this.setShape("rect", "circle");
        //todo -> add stopListening
        this.listenToClick("circle", "rect");
        this.listenToClick("rect", "circle");

        return this;
    },

    listenToClick: function(shape, other) {
        var self = this;
        this[shape].click(function() {
            self.setShape(shape, other);
        });
    },

    setShape: function(set, unset) {
        this[unset].attr({
            "fill-opacity": "0.01",
            "fill": "none"
        });
        this[set].attr({
            "fill-opacity": "1",
            "fill": "orange"
        });
        this.shape = set;
    },

    getState: function() {
        return {
            shape: this.shape
        };
    }
});

var InputOptionsView = Backbone.View.extend({

    events: {
        "click button": "onVisualizeClicked"
    },

    initialize: function(options) {
        this.options = options;
        this.views = [];
    },

    TRANSFORMATION_MATRIX: [
        [1, 3],
        [3, 1]
    ],

    render: function() {

        var row = $("<div class='row'> </div>");
        this.$el.append(row);

        var speedAndShapeColumn = $("<div class='col-xs-12 col-md-8'> </div>");
        var speedAndShapeContainer = $("<div class='row'>");
        var left = $("<div class='col-xs-6'>");
        var right = $("<div class='col-xs-6'>");
        speedAndShapeContainer.append(left).append(right);
        speedAndShapeColumn.append(speedAndShapeContainer);
        row.append(speedAndShapeColumn);


        var speedView = new SpeedView({}).render();
        right.append(speedView.$el);
        this.views.push(speedView);

        var shapeView = new MatrixShapeOptionsView({
            width: right.width(),
            height: speedView.$el.height()
        });
        left.append(shapeView.$el);
        shapeView.render();
        this.views.push(shapeView);


        var matrixColumn = $("<div class='col-xs-12 col-md-4'> </div>");
        row.append(matrixColumn);

        var h4 = $("<h4>").addClass("matrix-options-heading").html("Transformation Matrix");
        matrixColumn.append(h4);


        var matrixView = new MatrixInputView({
            top: h4.outerHeight(true),
            parent: matrixColumn,
            matrix: this.TRANSFORMATION_MATRIX
        });
        matrixColumn.append(matrixView.$el);
        matrixView.render();
        this.views.push(matrixView);
        


        this.renderVisualizeButton(this.$el);

        return this;
    },


    renderVisualizeButton: function(parent) {
        var button = $("<button class='btn waves-effect waves-light btn-large'>Visualize</button>").css({
            "width": "100%",
            "margin-top": "10px"
        }).attr("id", "matrix-visualize-btn");
        parent.append(button);
    },


    getState: function() {
        var state = {};
        this.views.forEach(function(view) {
            _.extend(state, view.getState());
        });
        return state;
    },

    onVisualizeClicked: function(evt) {
        this.options.visualize(this.getState());
    },
});

app.gridView = null;

var visualize = function(inputState) {
    
    console.log(inputState);
    if(app.gridView !== null) {
        app.gridView.remove();
    }

    var a = range(-1, 1, 0.2);
    if(inputState.shape === "rect") {
        axb = cartesianProduct(a, a);
    }
    else {
        axb = concentricCircles(200, 5, 20);
    }

    //First character of matrices are in uppercase
    var Transformation = $M(inputState.transformationMatrix);
    var Input = $M(axb);
    var Result = Input.multiply(Transformation);

    var options = {
        timeout: inputState.timeout,
        renderAxes: false,
        renderOnResize: false,
        maxPlotsPerRow: 2,
        plots: [Input.elements, Result.elements],
        colors: getColorsArray(axb.length * axb[0].length)
    };
    app.gridView = new SvgGridView(options);

    var y = app.gridContainer.offset().top;
    console.log("scrollTo: ", y);
    app.gridContainer.append(app.gridView.$el);
    app.gridView.render();
    window.scrollTo(0, Math.floor(y));
    
};

var render = function() {

    var inputOptionsView = new InputOptionsView({
        visualize: visualize
    });

    app.gridContainer = $("<div>");
    $("#svg-container").append(inputOptionsView.$el).append(app.gridContainer);
    inputOptionsView.render();

    window.app = app;
};


var ok = function() {
    //initColors();

    console.log("hi there sylvester");
   

    var a = range(-1, 1, 0.2);
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
        renderAxes: false,
        plots: [two.elements, result],
        colors: getColorsArray(axb.length * axb[0].length),
        maxPlotsPerRow: 2,
        timeout: 0,
        renderOnResize: false
    });

    var optionsView = new InputOptionsView({});
    $("#svg-container").append(optionsView.$el);
    optionsView.render();

    $("#svg-container").append(gridView.$el);
    gridView.render();

    window.S = S;
    window.axb = axb;
    window.ov = optionsView;
    //console.table(result);
}


module.exports = {
    render: render
}