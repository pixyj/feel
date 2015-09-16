//Copied from http://stackoverflow.com/a/4256130/817277
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var isNewlineTheLastChar = function(s) {
    if(s.length === 0) {
        return false;
    }
    var newLine = new RegExp("\n");
    var matched = newLine.exec(s);
    if(matched === null) {
        return false;
    }
    return matched.index >= s.length - 2;
};

var isNewlineTheFirstChar = function(s) {
    if(s.length === 0) {
        return false;
    }
    var newLine = new RegExp("\n");
    var matched = newLine.exec(s);
    if(matched === null) {
        return false;
    }
    return matched.index <=1;
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


var vectorReverse = function(v) {
    var r = _.map(v, function(i) {
        return -i;
    });
    return r;
};

var vectorAdd = function(a, b) {
    var lengthA = a.length;
    var lengthB = b.length;

    if(lengthA !== lengthB) {
        throw new Error("Vector lengths not equal. vectorAdd cannot be performed for ", a, b)
    }

    var result = new Array(lengthA);
    for(var i = 0; i < lengthA; i++) {
        result[i] = a[i] + b[i];
    }
    return result;
}

var vectorSubtract = function(a, b) {
    return vectorAdd(a, vectorReverse(b));
}

var vectorDotProduct = function(a, b) {

    var lengthA = a.length;
    var lengthB = b.length;

    if(lengthA !== lengthB) {
        throw new Error("Vector lengths not equal. vectorDotProduct cannot be performed", a, b);
    }

    var result = 0;
    for(var i = 0; i < lengthA; i++) {
        result += a[i]*b[i]
    }
    return result;
};  

var vectorMultiplyByScalar = function(v, scale) {
    var length = v.length;
    var result = new Array(length);
    for(var i = 0 ; i < length; i++) {
        result[i] = v[i] * scale;
    }
    return result;
}