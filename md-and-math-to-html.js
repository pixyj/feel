var converter = Markdown.getSanitizingConverter();


var mdAndMathToHtml = function(s) {
    var r = new RegExp("one", "g");
    var start = new RegExp("\<math\>", "g");
    var end = new RegExp("\</math\>", "g");

    var startTagPosition, endTagPosition;
    startTagPosition = start.exec(s);
    var resultArray = [];
    var inputArray = []; //for debugging purposes
    var nowIndex = 0;
    while(startTagPosition !== null) {
        
        endTagPosition = end.exec(s);
        //#todo add error handling in katex input later.
        //assert(endTagPosition !== null, "no [/math] found for [math] at " + startTagPosition.index);
        var mathExp = s.slice(startTagPosition.index + 6, endTagPosition.index);
        console.log("math expression: ", mathExp);

        var mathHtmlExp = katex.renderToString(mathExp);
        var beforeInput = s.slice(nowIndex, startTagPosition.index);
        before = converter.makeHtml(beforeInput);
        if(nowIndex === 0) {
            console.log("Trimming before", before);
            before = before.slice(3, before.length-4); //remove the p tags
            if(isNewlineTheLastChar(beforeInput)) {
                before += "<p></p>"
            }
        }
        else if(!isNewlineTheLastChar(beforeInput)) {
            console.log("Trimming before", before);
            before = before.slice(3, before.length-4); //remove the p tags
        }
        inputArray.push(beforeInput);
        inputArray.push(mathExp);

        resultArray.push(before);
        resultArray.push(mathHtmlExp);
        nowIndex = endTagPosition.index + 7;
        startTagPosition = start.exec(s);
        console.log("input", inputArray, "result", resultArray);
    }

    var lastInput = s.slice(nowIndex, s.length);
    console.log("lastInput: ", lastInput);
    last = converter.makeHtml(lastInput);
    if(!isNewlineTheFirstChar(lastInput)) {
        last = last.slice(3, last.length-4); //todo. make code DRY
    }
    resultArray.push(last);
    inputArray.push(lastInput);
    //console.log("input", inputArray, "result", resultArray);
    return resultArray.join("");
}