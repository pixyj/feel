var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;


var RadioInput = React.createClass({

    render: function() {

        var selectedClass = this.props.selected ? "radio-box-selected" : "";
        var boxClassName = "col-xs-1 radio-box {0}".format(selectedClass);

        var wavesEffect = this.props.selected ? "waves-effect": "";
        var displayClass = "col-xs-11 {0}".format(wavesEffect);

        return (

            <div className="row radio-item" onClick={this.toggleSelection}>
                <div className={boxClassName}>
                </div>
                <div className={displayClass}>
                    {this.props.item.display}
                </div>

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

        var heading = "";
        if(this.props.heading) {
            heading = <h4>{this.props.heading}</h4>
        }

        return (
            <div className={className} 
                 id={this.props.id || ""}>
                 {heading}
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
        }, 700); //700 is the waves-effect timeout. 
        
    }

});

module.exports = {
    RadioGroup: RadioGroup
}