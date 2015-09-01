//Copied from http://stackoverflow.com/a/4256130/817277
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

//inspired by http://ejohn.org/files/pretty.js
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

    else if(dayDiff < 7) {
        return dayDiff + " days ago";
    }
    else {
        var weeksDiff = Math.floor(dayDiff);
        return weeksDiff + " week{0} ago".format(weeksDiff > 1 ? "s": "");
        return Math.floor(dayDiff / 7) + " weeks ago"
    }
};


//http://stackoverflow.com/a/6777470/817277
var getUTCDate = function(now) {
    now = now || new Date();
    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    return now_utc;
};


var getHumanizedTimeDiff = function(localDate) {
    localDate = localDate || new Date();
    var utcDate = getUTCDate(localDate);
    return prettyDate(utcDate);
};
