var React = require("react");
var ReactDOM = require("react-dom");

var UserStatusComponent = React.createClass({

    getInitialState: function() {
        var attrs = this.props.store.toJSON();
        attrs.showLogout = false;
        attrs.logoutInProgress = false;
        return attrs;
    },

    render: function() {

        var username = "";
        if(this.props.store.isAuthenticated()) {
            username = <div className="username-or-login-btn" 
                                onClick={this.showLogout}>
                                {this.state.username}
                        </div>
        }
        else {
            username = <div id="login-btn" className="username-or-login-btn">
                            Login
                        </div>
        }
        var logout = "";
        var logoutCancel = "";
        if(this.state.showLogout) {
            var message = this.state.logoutInProgress ? "Logging Out ..." : "Logout";
            logout = <div id="logout" onClick={this.logout}>
                        {message}
                    </div>
            logoutCancel = <div id="logout-cancel" onClick={this.hideLogout}></div>

        }
        return (
            <div>
                {username}
                {logout}
                {logoutCancel}
            </div>
        );
    },

    showLogout: function() {
        this.setState({
            showLogout: true
        }); 
    },

    hideLogout: function() {
        this.setState({
            showLogout: false
        });
    },

    logout: function() {

        this.setState({
            showLogout: false,
            logoutInProgress: true
        });

        var self = this;
        this.props.store.logout().then(function() {
            self.setState(self.getInitialState());
        });
    }

});

var Store = function(options) {
    this._user = options.model;
};

Store.prototype = {

    isAuthenticated: function() {
        return this._user.isAuthenticated();
    },

    toJSON: function() {
        return this._user.toJSON();
    },

    logout: function() {
        return this._user.logout();
    }
};

Store.prototype.constructor = Store;

var render = function(userModel, element) {
    var store = new Store({
        model: userModel
    });
    ReactDOM.render(<UserStatusComponent store={store} />, element);
};

module.exports = {
    render: render
};