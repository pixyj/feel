var React = require("lib").React;
var _ = require("lib")._;

var DisabledMessage = React.createClass({
    
    render: function() {
        var className=this.props.className || "";
        if(!this.props.isVisible) {
            className += " invisible";
        }
        return (
            <div className={className}>
                {this.props.message}
            </div>
        );
    }

});

var SubmitThrottleMixin = {

    disableSubmit: function(time) {

        this.setState({
            submitDisabled: true,
            showSubmitDisabledMessage: true
        });

        var self = this;
        this._throttleTimer = setTimeout(function() {
            self.setState({
                submitDisabled: false,
                showSubmitDisabledMessage: false
            });
            self._throttleTimer = null;
        }, this.state.disabledTimeout * 1000);

        this._messageTimer = setTimeout(function() {
            self.setState({
                showSubmitDisabledMessage: false,
                disabledTimeout: _.min([self.state.disabledTimeout * 2, 40])
            });
            if(self.onSubmitReEnabled && _.isFunction(self.onSubmitReEnabled)) {
                self.onSubmitReEnabled.call(this);
            }
        }, 3000);
    },

    initThrottler: function() {
        this._throttleTimer = null;
        this._messageTimer = null;

        return {
            submitDisabled: false,
            showSubmitDisabledMessage: false,
            disabledTimeout: 10
        };
    },

    SUBMIT_DISABLED_MESSAGE: "Oops ... You can make another attempt in {0} seconds",

    getSubmitDisabledMessageComponent: function(props) {

        var isVisible = this.state.showSubmitDisabledMessage;
        return <DisabledMessage 
                    message={this.SUBMIT_DISABLED_MESSAGE.format(this.state.disabledTimeout)} 
                    isVisible={isVisible} 
                    {...props} />
    },

    cleanupThrottler: function() {
        if(this._throttleTimer !== null) {
            clearTimeout(this._throttleTimer);
            this._throttleTimer = null;
        }
        if(this._messageTimer !== null) {
            clearTimeout(this._messageTimer);
            this._messageTimer = null;
        }
    }

};

module.exports = {
    SubmitThrottleMixin: SubmitThrottleMixin
};
