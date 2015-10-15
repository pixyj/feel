var app = {
    quizModel: new QuizModel({
        questionInput: "<math>sin^2(x) + cos^2(x) = </math> ___________ ?",
        answer: "1",
        quizType: constants.SHORT_ANSWER
    }),
    eventBus: _.extend({}, Backbone.Events),
};

var init = function() {

    ok = React.render(
        <QuizPreview model={app.quizModel} />, 
        document.getElementById("prereq-test-content")
    );

    React.render(
        <QuizPreview model={app.quizModel} />, 
        document.getElementById("inline-test-content")
    );

};

init();