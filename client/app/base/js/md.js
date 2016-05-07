var Remarkable = require("lib").Remarkable;
var hljs = require("lib").hljs;

var isWrappedByPTag = function(s) {
    return s.indexOf("<p>") === 0;
};

var md = new Remarkable({
  highlight: function (str) {
    var lang = "python";
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (err) {}
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (err) {}

    return ''; // use external default escaping
  }
});

var mdAndMathToHtml = function(s) {
    var x = md.render(s);
    return x;
}


module.exports = {
    mdAndMathToHtml: mdAndMathToHtml,
    isWrappedByPTag: isWrappedByPTag
}
