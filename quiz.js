var converter = Markdown.getSanitizingConverter();

var mathToHtml = function(html) {
    var maths = new RegExp("[math].*[/math]", "g")
};

var assert = function(result, message) {
    if(result === false) {
        console.error("Assertion error", message);
    }
}

var fun = function(s) {
    var r = new RegExp("one", "g");
    var start = new RegExp("\<math\>", "g");
    var end = new RegExp("\</math\>", "g");

    var startTagPosition, endTagPosition;
    startTagPosition = start.exec(s);
    var resultArray = [];
    var inputArray = [];
    var nowIndex = 0;
    while(startTagPosition !== null) {
        
        endTagPosition = end.exec(s);
        assert(endTagPosition !== null, "no [/math] found for [math] at " + startTagPosition.index);
        var mathExp = s.slice(startTagPosition.index + 6, endTagPosition.index);
        console.log("math expression: ", mathExp);

        var mathHtmlExp = katex.renderToString(mathExp);
        var beforeInput = s.slice(nowIndex, startTagPosition.index);
        before = converter.makeHtml(beforeInput);
        inputArray.push(beforeInput);
        inputArray.push(mathExp);

        resultArray.push(before);
        resultArray.push(mathHtmlExp);
        nowIndex = endTagPosition.index + 7;
        startTagPosition = start.exec(s);
        console.log("input", inputArray, "result", resultArray);
    }
    var lastInput = s.slice(nowIndex, s.length);
    last = converter.makeHtml(lastInput);
    resultArray.push(last);
    inputArray.push(lastInput);
    console.log("input", inputArray, "result", resultArray);
    return resultArray.join("");
}

var mdToHtml = function(evt) {
    
    var md = evt.target.value;
    var html = fun(md);
    $(".quiz-question-preview").html(html);

};

var init = function() {
    $(".quiz-creator-question-input").change(mdToHtml).keyup(mdToHtml);
};

//$(document).ready(init);