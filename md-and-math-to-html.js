var reader = new commonmark.Parser();
var writer = new commonmark.HtmlRenderer();

var mdAndMathToHtml = function(s) {
    var parsed = reader.parse(s);

    var walker = parsed.walker();
    var event, node;

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
    }

    var result = writer.render(parsed); 

    return result;
}

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