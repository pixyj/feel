var React = require("react");

var LoadingCircle = React.createClass({

    getInitialState: function() {
        return {
            show: false
        }
    },

    componentDidMount: function() {
        var self = this;
        this._timer = setTimeout(function() {
            self.setState({
                show: true
            })
        }, 750);
    },

    componentWillUnmount: function() {
        clearTimeout(this._timer);
    },

    render: function() {

        if(!this.state.show) {
            return (
                <div> </div>
            );
        }

        return (
            <div className="preloader-wrapper active">
              <div className="spinner-layer spinner-blue-only">
                <div className="circle-clipper left">
                  <div className="circle"></div>
                </div><div className="gap-patch">
                  <div className="circle"></div>
                </div><div className="circle-clipper right">
                  <div className="circle"></div>
                </div>
              </div>
            </div>
        );
    }
});

module.exports = {
    LoadingCircle: LoadingCircle
};