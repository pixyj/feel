var React = require("lib").React;
var ReactDOM = require("lib").ReactDOM;

var Backbone = require("lib").Backbone;

var LoginForm = React.createClass({

    render: function() {
        return (
            <div id="login-form">
                <a href="/accounts/google/login/?process=login">
                    <div className="signin-item card" 
                         data-url="/accounts/google/login/?process=login"
                         onClick={this.onSigninItemClicked}>

                        <img className="signin-image" 
                             src="/dist/images/google-signin.jpg" 
                             alt="Sign in with Google" />
                             <div>Sign in with Google</div>
                    </div>
                </a>
                <a href="/accounts/github/login/?process=login">
                    <div className="signin-item card" 
                         data-url="/accounts/github/login/?process=login"
                         onClick={this.onSigninItemClicked}>
                            <img className="signin-image" 
                                 src="/dist/images/github-signin.png" 
                                 alt="Sign in with GitHub" />
                            <div>Sign in with GitHub</div>
                    </div>
                </a>
            </div>
        );
    },

    onSigninItemClicked: function(evt) {
        return;
        var el = $(evt.target);
        var url = el.attr("url");
        if(!url) {
            url = el.parent().attr("url");
        }
        window.location = url;
    }
});

var UserStatusComponent = React.createClass({

    getInitialState: function() {
        var attrs = this.props.store.toJSON();
        attrs.showLogout = false;
        attrs.logoutInProgress = false;
        attrs.showLoginForm = false;
        return attrs;
    },

    render: function() {

        var username = "";
        if(this.props.store.isAuthenticated()) {
            username = <div className="username-or-login-btn" 
                                onClick={this.showLogout}>
                                {utils.capitalize(this.state.username)}
                        </div>
        }
        else {
            username = <div id="login-btn" 
                            className="username-or-login-btn"
                            onClick={this.showLoginForm}>
                            <btn className="btn">Log In / Sign Up</btn>
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

        var loginForm = "";
        var loginFormCancel = "";
        if(this.state.showLoginForm) {
            loginForm = <LoginForm />
            loginFormCancel = <div  id="logout-cancel" 
                                    className="overlay" 
                                    onClick={this.hideLoginForm}></div>
        }

        return (
            <div>
                {username}
                {logout}
                {logoutCancel}
                {loginForm}
                {loginFormCancel}
            </div>
        );
    },

    showLoginForm: function() {
        this.setState({
            showLoginForm: true
        });
        localStorage.setItem("lastVisitedURL", Backbone.history.getFragment());
    },

    hideLoginForm: function() {
        this.setState({
            showLoginForm: false
        });
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
        return this._user.logout().then(function() {
            Backbone.history.navigate("logged-out/", {trigger: true});
        });
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