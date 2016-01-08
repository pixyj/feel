var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;


var RadioInput = React.createClass({

    render: function() {

        var className = "radio-item ";
        if(this.props.selected) {
            className += "radio-item selected waves-effect";
        }
        return (

            <div className="radio-item" onClick={this.toggleSelection}>
                    {this.props.item.display}
            </div>
        );
    },

    toggleSelection: function() {
        this.props.parent.toggleSelection(this.props.index);
    }
});

var RadioGroup = React.createClass({

    getInitialState: function() {
        return {
            selected: null,
            hide: false,
            enabled: true
        };
    },

    componentWillUnmount: function() {
        if(this._timer) {
            clearTimeout(this._timer);
        }
    },

    render: function() {

        var items = this.props.items;
        var inputs = [];
        var length = items.length;
        for(var i = 0; i < length; i++) {
            var item = items[i];
            var input = <RadioInput item={item} 
                                    key={i} 
                                    index={i}
                                    className={this.props.inputClassName || ""} 
                                    selected={i === this.state.selected} 
                                    parent={this} 
                                    hide={this.state.hide} />
            inputs.push(input);
        }

        var hideClass = this.state.hide ? "radio-group-hide" : "";
        var className = "radio-group {0} {1}".format(hideClass, this.props.className || "");

        return (
            <div className={className} 
                 id={this.props.id || ""}>
                 {inputs}
            </div>
        );
    },

    toggleSelection: function(key) {
        if(!this.state.enabled) {
            return;
        }
        var currentKey;
        if(key === this.state.selected) {
            currentKey = null;
        }
        else {
            currentKey = key;
        }

        var hide = this.props.hideOnSelection;
        this.setState({
            selected: currentKey,
            hide: hide,
            enabled: false
        });

        var self = this;
        this._timer = setTimeout(function() {
            self.props.onChange.call(self.props.parent, currentKey);
        }, 50); //50 is the waves-effect timeout. 
        
    }

});

module.exports = {
    RadioGroup: RadioGroup
}