var S = require("sylvester");

var $ = require("lib").$;
var _ = require("lib")._;
var Backbone = require("lib").Backbone;

var Common = require("./common");

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


        var speedView = new Common.SpeedView({}).render();
        right.append(speedView.$el);
        this.views.push(speedView);

        var shapeView = new Common.MatrixShapeOptionsView({
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


        var matrixView = new Common.MatrixInputView({
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
        this.visualize(inputState, this.visualizationEl);

    },

    visualize: function(inputState, parent) {
        
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

    }
});

var render = function() {
    var containerView = new ContainerView();
    return containerView;
};

module.exports = {
    render: render
}