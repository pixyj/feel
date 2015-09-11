var VectorModel = Backbone.Model.extend({

    defaults: {
        a: [1, 3],
        b: [-1, -1]
    },

    //as usual, names for vectors are taken from Gilbert Strang
    initialize: function() {
        var p = this.calcP();
        var e = this.calcE(p);

        //todo -> make calculation `p` and `e` DRY
        this.set({
            p: p,
            e: e
        });

        this.on("change", this.calcPAndE, this);
        
    },

    calcPAndE: function() {
        //console.debug("calculating P and E");
        var p = this.calcP();
        var e = this.calcE(p);

        console.info("p", p, "e", e);
        this.set({
            p: p,
            e: e
        });
    },

    //formula taken from page 207
    calcP: function() {
        var dot = vectorDotProduct;

        var a = this.attributes.a;
        var b = this.attributes.b;
        var x_hat = dot(a, b) / dot(a, a);
        var p = vectorMultiplyByScalar(a, x_hat);
        console.log("x_hat", x_hat, "p", p);
        
        //console.debug("a", a, "p", p);
        return p;
    },

    calcE: function(p) {
        return vectorSubtract(this.attributes.b, p);
    }

});



var SvgModel = Backbone.Model.extend({

    initialize: function() {
        var requiredSize = this.getRequiredSvgSize();
        this.attributes.width = requiredSize;
        this.attributes.height = requiredSize;
        this.listenToResize();
    },

    getWindowSize: function() {
        var width = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;

        var height = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;

        var size =  {
            width: width,
            height: height
        };
        console.info("Window Size", size);
        return size;
    },

    getRequiredSvgSize: function() {
        var size = this.getWindowSize();
        console.log("requiredSize candidates", size);
        return _.min([size.width, size.height]);
    },

    listenToResize: function() {
        var self = this;
        $(window).resize(function() {
            var attrs = self.getWindowSize();
            var width = attrs.width;
            var height = attrs.height;
            console.log(width, height);
            var size = self.getRequiredSvgSize(width, height);
            self.set({
                width: size,
                height: size
            });
        });
    },

    //not using camelCase for last two arguments for readability
    humanToSvgCoordinates: function(human_x, human_y) {
        console.info("human_x", human_x, "human_y", human_y);
        console.info("attributes", this.attributes)
        var x = human_x + this.attributes.width / 2;
        var y = -human_y + this.attributes.height / 2;
        console.info("svg x", x, "svg y", y);
        return {
            x: x,
            y: y
        };
    },

    svgToHumanCoordinates: function(svg_x, svg_y) {
        return {
            x: ( svg_x - this.attributes.width/2 ),
            y: -( svg_y - this.attributes.height/2 )
        }
    },

    vectorToHumanCoordinates: function(vector) {
        var attrs = vector.attributes;

        return {
            x: attrs.x * this.attributes.scale,
            y: attrs.y * this.attributes.scale
        };

    }

});

var app = {
    vectorModel: new VectorModel()
    //svgModel: new SvgModel()
};

var ProjectionSVGView = React.createClass({

    getInitialState: function() {

        this.vectorModel = app.vectorModel;
        this.svgModel = app.svgModel = new SvgModel();

        var svgSize = this.svgModel.getRequiredSvgSize();
        console.log("svgSize: ", svgSize);

        var a = [svgSize/6, svgSize/6];
        var b = [svgSize/6, 0];

        this.vectorModel.set({
            a: a,
            b: b
        });

        var attrs = this.calcStateAttrs(svgSize);

        return attrs;
    },

    calcStateAttrs: function(svgSize) {

        var a = this.vectorModel.get("a");
        var b = this.vectorModel.get("b");
        var p = this.vectorModel.get("p");
        var e = this.vectorModel.get("e");

        return {
            
            height: svgSize,
            width: svgSize,

            xAxis: {
                x1: -svgSize/2,
                y1: 0,
                x2: svgSize/2,
                y2: 0
            },

            yAxis: {
                x1: 0,
                y1: -svgSize/2,
                x2: 0,
                y2: svgSize/2
            },

            a: {
                x1: 0,
                y1: 0,
                x2: a[0],
                y2: a[1]
            },

            b: {
                x1: 0,
                y1: 0,
                x2: b[0],
                y2: b[1]
            },

            p: {
                x1: 0,
                y1: 0,
                x2: p[0],
                y2: p[1]
            },

            e: {
                x1: 0,
                y1: 0,
                x2: e[0],
                y2: e[1]
            }

        };
    },

    componentDidMount: function() { 

        this.listenToResize();

        var self = this;
        this.svg = d3.select("svg");
        this.svg.on("click", function() {
            var point = d3.mouse(self.svg.node());
            self.moveSelectedVector(point);
        });
    },

    listenToResize: function() {
        this.svgModel.on("change:width", this.resizeSvg, this);
    },

    componentWillUnmount: function() {
        this.svg.off("click");
        this.svgModel.off("change:width", this.resizeSvg);
    },

    resizeSvg: function() {
        var svgSize = this.svgModel.get("width");
        this.setState(this.calcStateAttrs(svgSize));
    },

    moveSelectedVector: function(svgPoint) {
        console.log(svgPoint);
        var humanPoint = this.svgModel.svgToHumanCoordinates(svgPoint[0], svgPoint[1]);

        var a = _.clone(this.state.a);
        a.x2 = humanPoint.x;    
        a.y2 = humanPoint.y;

        this.vectorModel.set({
            a: [a.x2, a.y2]
        });

        var svgSize = this.svgModel.getRequiredSvgSize();

        var attrs = this.calcStateAttrs(svgSize);

        this.setState(attrs);
    },

    getSvgPoints: function() {
            var lines = ['xAxis', 'yAxis', 'a', 'b', 'p', 'e'];
            console.table(this.state);
            var result = {};
            var self = this;
            _.each(lines, function(lineName) {
                line = self.state[lineName];
                console.info("line, ", lineName, line)
                var start = self.svgModel.humanToSvgCoordinates(line.x1, line.y1);
                var end = self.svgModel.humanToSvgCoordinates(line.x2, line.y2);
                console.info("start, ", start, "end, ", end);
                transformedLine = {
                    x1: start.x,
                    y1: start.y,
                    x2: end.x,
                    y2: end.y
                };
                result[lineName] = transformedLine;
            });
            console.log(result);
            return result;
    },

    render: function() {

        console.debug("Rendering");
        var svgPoints = this.getSvgPoints();
        //console.table(svgPoints);

        var xa = svgPoints.xAxis;
        var ya = svgPoints.yAxis

        var a = svgPoints.a;
        var b = svgPoints.b;

        var p = svgPoints.p;
        var e = svgPoints.e;

        console.table(svgPoints)
        console.debug("a", a, "b", b, "p", p, "e", e);

        var markerEnd = "url(#markerArrow)";
        var fill = "#000000";

        return (
            <div>
                <svg height={this.state.height} width={this.state.width}>

                    <defs>
                        <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="2" refY="6"
                               orient="auto">
                            <polygon points="200,10 250,190 160,210" style={{fill}}/>
                        </marker>
                    </defs>


                    <line x1={xa.x1} y1={xa.y1} x2={xa.x2} y2={xa.y2} strokeWidth="2" stroke="orange"  strokeDasharray="1, 5" className="co-ordinate"/>  

                    <line x1={ya.x1} y1={ya.y1} x2={ya.x2} y2={ya.y2} strokeWidth="2" stroke="orange"  strokeDasharray="1, 5" className="co-ordinate"/>

                    
                    <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} strokeWidth="2" stroke="#6A1B9A"  data-vec="a"/>  
                    <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} strokeWidth="2" stroke="#C62828"  data-vec="b"/> 


                    <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth="2" stroke="#009688"  strokeDasharray="5, 5" data-vec="p" markerEnd={markerEnd}/>  
                    <line x1={e.x1} y1={p.y1} x2={e.x2} y2={e.y2} strokeWidth="2" stroke="#4CAF50" strokeDasharray="5, 5" data-vec="e"/> 


                </svg>
            </div>
        );
    }
});

var ProjectionControlView = React.createClass({

    getInitialState: function() {
        
        this.vectorModel = app.vectorModel;
        
        var attrs = this.vectorModel.attributes;

        return {
            a: attrs.a,
            b: attrs.b
        }
    },

    componentDidMount: function() {
        this.vectorModel.on("change", this.updateInfo, this);
    },

    componentWillUnmount: function() {
        this.vectorModel.off("change", this.updateInfo);
    },

    updateInfo: function() {
        var attrs = this.vectorModel.attributes;
        this.setState({
            a: attrs.a,
            b: attrs.b
        });
    },

    getKatexViewForVector: function(name, vector) {
        //k for katex
        //using string concat for multi-line string http://stackoverflow.com/a/6247331/817277
        //phew!
        var k = name + " " + 
            "\\begin{bmatrix} " + 
            vector[0] + "\\\\ " + 
            vector[1] + " "     +
            "\\end{bmatrix}"

        var ok = katex.renderToString(k); //just a filler temp variable for debbuging, ok? 
        return ok;
    },

    getKatexAbsForVector: function(name, vector) {
        var abs = Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1]);
        var truncated = Number(abs).toFixed(2);
        var k = "|{0}| = {1}".format(name, truncated);
        var ok = katex.renderToString(k);
        return ok;
    },
    
    //using Gilbert Strang's convention of lower-case names for 1-d vectors and uppercase for higher dimension matrices
    render: function() {
        
        var aView = this.getKatexViewForVector("a", this.state.a);
        var bView = this.getKatexViewForVector("b", this.state.b);
        var aAbs = this.getKatexAbsForVector("a", this.state.a);
        var bAbs = this.getKatexAbsForVector("b", this.state.b);

        return (
            <div>
                <div className="row">
                    <div className="col s6">
                        <button className="vector-A btn" data-line="#a"> Team A </button>
                        <div className="vector-A-details">
                            <div dangerouslySetInnerHTML={{__html: aView}} />

                        </div>
                        <div className="vector-A-details">
                            <div dangerouslySetInnerHTML={{__html: aAbs}} />
                        </div>

                    </div>

                    <div className="col s6">
                         <button className="vector-B btn" data-line="#b"> Team B </button>
                         <div className="vector-B-details">
                            <div dangerouslySetInnerHTML={{__html: bView}} />

                        </div>
                         <div className="vector-B-details">
                            <div dangerouslySetInnerHTML={{__html: bAbs}} />
                        </div>
                    </div>

                </div>

            </div>
        );
    }

});


var ProjectionBox = React.createClass({

    render: function() {
        return (
            <div className="row projection-interactive">

                <div className="col s9 m6">
                    <ProjectionSVGView />
                </div>

                <div className="col s3 m6">
                    <ProjectionControlView />
                </div>

            </div>
        );
    }

});


var init = function() {

    React.render(
        <ProjectionBox />, 
        document.getElementById("page-container")
    );

};

init();




