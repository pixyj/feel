var React = require("react");
var ReactDOM = require("react-dom");

var _ = require("underscore");
var Backbone = require("backbone");

var utils = require("utils");

var connected = require("./../../conceptviz/js/connected");

var app = {

};

var Store = function(options) {
    this.options = options;
};

Store.prototype = {

    getName: function() {
        return "";
    }
};

Store.prototype.constructor = Store;

var CourseNameComponent = React.createClass({

    getInitialState: function() {
        return {
            name: this.props.store.getName()
        }
    },

    //todo -> rename concept-creator-section to creator-section
    render: function() {
        return (
            <div className="row concept-creator-section card">
                <h4> Course Name </h4>
                <input  type="text" 
                        placeholder="What's in a name?" 
                        value={this.state.name} 
                        onKeyup={this.updateName} 
                        onChange={this.updateName} /> 
            </div>
        );
    },

    updateName: function(evt) {
        var name = evt.target.value;
        this.setState({
            name: name
        });
    }
});


var PageComponent = React.createClass({

    render: function() {

        return (
            <div>
                <CourseNameComponent store={this.props.store} />
            </div>

        );

    }
})

Store.prototype.constructor = Store;

var render = function(options, element) {
    options = options || {};

    var onReady = function() {
        ReactDOM.render(<PageComponent store={app.store} />, element); 
        
        var graphView = connected.render();  
        $(element).append(graphView.$el);
        graphView.render();     
    };


    app.store = new Store(options);

    onReady();
    // options.onReady = onReady;


    // if(!options.uuid) {
    //     onReady();
    // }


};

var unmount = function() {

};

module.exports = {
    render: render,
    unmount: unmount
}

window.connected = connected;
