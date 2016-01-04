//Copied from http://stackoverflow.com/a/4256130/817277
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var addTrailingSlash = function(fragment) {
    if(fragment.slice(fragment.length-1) === "/") {
        return fragment;
    }
    return fragment + "/";
};

//http://stackoverflow.com/a/6777470/817277
var getUTCDate = function(now) {
    now = now || new Date();
    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    return now_utc;
};

var prettyDate = function(utcDate) {
    var utcNow = getUTCDate(new Date());
    var diff = ((utcNow.getTime() - utcDate.getTime()) / 1000);
    var dayDiff = Math.floor(diff / 86400);

    if(dayDiff == 0) {
        if(diff < 60) {
            return "Just now";
        }
        else if(diff < 3600) {
            var minuteDiff = Math.floor(diff/60);
            return minuteDiff + " minute{0} ago".format(minuteDiff > 1 ? "s" : ""); 
        }
        else {
            var hoursDiff = Math.floor(diff/3600);
            return hoursDiff + " hour{0} ago".format(hoursDiff > 1 ? "s" : "");
        }
    }

    else if(dayDiff === 1) {
        return "Yesterday"
    }

    else {
        return dayDiff + " days ago";
    }
};

var capitalize = function(s) {
    var length = s.length;
    if(!length) {
        return s
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
};

var getHumanizedTimeDiff = function(localDate) {
    localDate = localDate || new Date();
    var utcDate = getUTCDate(localDate);
    return prettyDate(utcDate);
};

var getUniqueId = function() {

    var id = 0;
    var getId = function() {
        id += 1;
        return id;
    }
    return getId;
}();

var inherit = function(child, parent) {

    var parentKeys = Object.keys(parent);

    var length = parentKeys.length;
    for(var i = 0; i < length; i++) {
        var key = parentKeys[i];
        if( !child.hasOwnProperty(key) ) {
            child[key] = parent[key];
        }
    }
    return child;
};

var assert = function(condition, message) {
    if(!condition) {
        console.error(message);
    }
};

module.exports = {
    getUTCDate: getUTCDate,
    prettyDate: prettyDate,
    capitalize: capitalize,
    getHumanizedTimeDiff: getHumanizedTimeDiff,
    getUniqueId: getUniqueId,
    inherit: inherit,
    assert: assert,
    addTrailingSlash: addTrailingSlash
};

window.utils = module.exports;
