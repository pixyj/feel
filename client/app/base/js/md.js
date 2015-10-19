var katex = require("../../../katex/katex.min");
window.katex = katex;

var commonmark = window.commonmark;


var reader = new commonmark.Parser();
var writer = new commonmark.HtmlRenderer();

var isPlainTextWithPTag = function(s) {
    var tags = ["h1", "img", "h2", "em", "<strong>", "<blockquote>", "<pre>", "<ol>", "<ul>", "<hr>"];
    if(s.indexOf("<p>") !== 0) {
        return false;
    }
    if(s.indexOf("</p>") !== s.length - 4) {
        return false;
    }
    var i; 
    var length = tags.length;
    for(i = 0; i < length; i++) {
        if(s.indexOf(tags[i]) !== -1) {
            return false;
        }
    }
    return true;
}

var isWrappedByPTag = function(s) {
    return s.indexOf("<p>") === 0;
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

var mdAndMathToHtml = function(s) {
    var parsed = reader.parse(s);

    var walker = parsed.walker();
    var event, node;

    var isMathLiteral = function(s) {
        s = s.trim();
        //starts with <math> and ends with </math>
        return s.indexOf("<math>") === 0 && s.indexOf("</math>") === s.length - 7
    };

    var getContentFromMathLiteral = function(s) {
        s = s.trim();
        return s.slice(6, s.length-7);
    };

    var now = false;
    while ((event = walker.next())) {
        node = event.node;
        if(node.type === "Html" && node.literal=== "<math>") {
            node._type = "MathStartTag";
            console.log("Starting math");
            var mathBuffer = "";
            var lastInternalNode = null;
            while((event = walker.next())) {
                node = event.node;
                console.log("mathBuffer", mathBuffer);
                if(node.type === "Html" && node.literal === "</math>") {
                    console.log("ending math");
                    if(lastInternalNode !== null) {
                        lastInternalNode.literal = katex.renderToString(mathBuffer);
                        lastInternalNode._type = "Katex";
                    }
                    break;
                }
                else {
                    if(node.literal) {
                        mathBuffer += node.literal;
                    }
                    lastInternalNode = node;
                    node.literal = "";
                }
            }
        }

        else if(node.type === "HtmlBlock" && isMathLiteral(node.literal)) {
            node._type = "Katex";
            node.literal = katex.renderToString(getContentFromMathLiteral(node.literal));
        }
    }

    var result = writer.render(parsed); 

    return result;
}

//ES6 will make this DRY.
module.exports = {
    mdAndMathToHtml: mdAndMathToHtml,
    isWrappedByPTag: isWrappedByPTag
}
