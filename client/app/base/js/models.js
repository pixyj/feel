var Backbone = require("lib").Backbone;
var _ = require("lib")._;


var UserModel = Backbone.Model.extend({

    defaults: {
        isAnonymous: true
    },

    url: function() {
        return "/api/v1/user/"
    },

    isAuthenticated: function() {
        return !this.attributes.isAnonymous;
    },

    logout: function() {
        this.url = "/api/v1/user/logout/";
        return this.save();
    }
});

var StreamSaveModel = Backbone.Model.extend({

    MAX_REQUESTS_PER_SECOND: 1,

    initialize: function() {
        
        //this._triggerIsSavedChanged = _.debounce(this._triggerIsSavedChanged, 1000, {immedate: false});

        this._lastRequestId = 0;
        this._lastSavedRequestId = 0;
        this._isSaved = true;

        this._saveImpl = _.throttle(this._saveImpl, 1000 / this.MAX_REQUESTS_PER_SECOND);
    },

    save: function() {

        if(this.isSaved()) {
            console.info("saving", this._lastRequestId);
            this._lastRequestId += 1;
            this._saveImpl();
        }
        else {
            console.info("inc requestId, don't save now");
            this._lastRequestId += 1;
        }
        this._updateIsSaved();

    },

    _saveImpl: function() {

        var requestId = this._lastRequestId;  
        var self = this; 
        var callback = function() {
            console.info("Saved: ", requestId);
            self._lastSavedRequestId = requestId;
            self._updateIsSaved();
            if(!self.isSaved()) {
                console.info("saving ", self._lastRequestId);
                self._saveImpl();
            }
        };
        Backbone.Model.prototype.save.apply(this, arguments).then(callback);
    },

    isSaved: function() {
        return this._lastSavedRequestId == this._lastRequestId;
    },

    _updateIsSaved: function() {
        var previousStatus, currentStatus;
        previousStatus = this._isSaved;
        currentStatus = this.isSaved();
        this._isSaved = currentStatus;

        if(previousStatus !== currentStatus) {
            this._triggerIsSavedChanged();
        }
    },

    _triggerIsSavedChanged: function() {
        console.info("isSaved changed", this._isSaved);
        this.trigger("change:isSaved", this._isSaved);
    }
});

module.exports = {
    UserModel: UserModel,
    StreamSaveModel: StreamSaveModel
};