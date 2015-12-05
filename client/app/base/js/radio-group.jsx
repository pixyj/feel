var React = require("react");
var ReactDOM = require("react-dom");


var RadioInput = React.createClass({

    render: function() {
        var boxClassName = "col-xs-1 radio-box  ";
        if(this.props.selected) {
            boxClassName += "radio-box-selected"
        }
        return (

            <div className="row radio-item" onClick={this.toggleSelection}>
                <div className={boxClassName}>
                </div>
                <div className="col-xs-11">
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
            selected: null
        };
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
                                    parent={this} />
            inputs.push(input);
        }
        return (
            <div className={this.props.className || ""} 
                 id={this.props.id || ""}>
                 {inputs}
            </div>
        );
    },

    toggleSelection: function(key) {
        var currentKey;
        if(key === this.state.selected) {
            currentKey = null;
        }
        else {
            currentKey = key;
        }
        this.setState({
            selected: currentKey
        });
    }

});

module.exports = {
    RadioGroup: RadioGroup
}