var S = require("sylvester");

var $ = require("jquery");
var _ = require("underscore");
var Backbone = require("backbone");

var Common = require("./common");

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

        var height = this.options.height - h4.height();
        var width = this.options.width;

        var size = _.min([width, height]);

        var shapeSize = size*0.45 - 6; //-6px to accomodate 3px border //0.45 to leave some gap
        var circle = $("<div class='matrix-shape-input matrix-shape-input-circle'>").css({
            "width": shapeSize,
            "height": shapeSize
        });
        var rect = $("<div class='matrix-shape-input matrix-shape-input-rect'>").css({
            "width": shapeSize,
            "height": shapeSize
        });


        var container = $("<div class='matrix-shape-input-container'>").append(circle).append(rect);
        this.$el.append(container);

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
        this[set].addClass("matrix-shape-input-selected");
        this[unset].removeClass("matrix-shape-input-selected");
        this.shape = set;
    },

    getState: function() {
        return {
            shape: this.shape
        };
    }
});

var InputOptionsView = Backbone.View.extend({

    el: "<div class='row'>",

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

        var row = this.$el;

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
        var callback = this.options.visualize.callback;
        var context = this.options.visualize.context;
        callback.call(context, this.getState());
    },
});


var ContainerView = Backbone.View.extend({

    initialize: function() {

    },

    render: function() {

        this.inputOptionsView = new InputOptionsView({
            visualize: {
                callback: this.renderVisualization,
                context: this
            }
        });
        this.visualizationEl = $("<div>");
        this.$el.append(this.inputOptionsView.$el).append(this.visualizationEl);
        this.inputOptionsView.render();

        
        
        return this;
    },

    renderVisualization: function(inputState) {
        this.visualizationEl.empty();
        visualize(inputState, this.visualizationEl);

    }
});

var visualize = function(inputState, parent) {
    
    var a = Common.range(-1, 1, 0.2);
    if(inputState.shape === "rect") {
        axb = Common.cartesianProduct(a, a);
    }
    else {
        axb = Common.concentricCircles(200, 20, 20);
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
        colors: Common.getColorsArray(axb.length * axb[0].length)
    };   


    var y = parent.offset().top;
    console.log("scrollTo: ", y);
    window.scrollTo(0, Math.floor(y));

    var gridView = new Common.SvgGridView(options);
    parent.append(gridView.$el);
    gridView.render();

};

var render = function() {
    var containerView = new ContainerView();
    return containerView;
};

module.exports = {
    render: render
}