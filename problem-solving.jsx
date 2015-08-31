var app = function() {

    var quizModel = new QuizModel({
        quizType: constants.SHORT_ANSWER,
        questionInput: "Hi There",
        questionDisplay: "If you are using  a distributed `NoSQL` database, can you provide `ACID` capabilities? ",
        answer: "12"
    });

    var shortAnswerModel = new ShortAnswerSubmitModel();
    var mcqAnswerModel = new MCQAnswerModel();

    return {
        quizModel: quizModel,
        shortAnswerModel: ShortAnswerSubmitModel,
        mcqAnswerModel: mcqAnswerModel
    };

}();


var ProblemSolvingBox = React.createClass({

    getInitialState: function() {
        return {
            quizModel: app.quizModel,
            shortAnswerModel: app.shortAnswerModel,
            mcqAnswerModel: app.mcqAnswerModel
        };
    },

    render: function() {
        var quizHeading = "Let's solve this problem";
        var statusHeading = "Here's your progress";
        return (
            <div>
                <div className="row">
                    
                    <div className="col s6">
                        <h4 className="problem-solving-top-header"> {quizHeading} </h4>
                        <QuizPreview model={this.state.quizModel} 
                                     shortAnswerModel={this.state.shortAnswerModel} 
                                     mcqAnswerModel={this.state.mcqAnswerModel} />
                    </div>

                    <div className="col s6">
                        <h4 className="problem-solving-top-header"> {statusHeading} </h4>
                        <ol>

                            <li > Understand the Problem </li>
                            <li> Come up with a plan and execute it </li>
                            <li> Analyze your solution </li> 
                        </ol>
                        <h5> Your Guesses so far </h5> 
                            <ol>
                                <li> 
                                    <strong>1</strong> 
                                    <label className="quiz-student-guess-ago"> 10 minutes ago based on Plan 1</label> 
                                </li>

                                <li> 
                                    <strong>1</strong> 
                                    <label className="quiz-student-guess-ago"> 5 minutes ago based on Plan 2</label> 
                                </li>

                                <li> 
                                    <strong>1</strong> 
                                    <label className="quiz-student-guess-ago"> 2 minutes ago based on Plan 3</label> 
                                </li>

                                <li> 
                                    <strong>12</strong> 
                                    <label className="quiz-student-guess-ago"> Just now </label> 
                                    <span>is the correct answer! </span> 
                                     
                                </li>
                            </ol>
                    </div>

                </div>

                <div>

                    <h5>1. Understand the problem </h5> 
                    <textarea placeholder="State the problem in your own words and ensure you have understood the problem correctly" />
                    <button className="btn waves-effect waves-light">Done </button> 

                    <h5>3. Plan 1 </h5> 
                    <textarea placeholder="Awesome. Explain your plan and execute it. If you obtain the solution, enter the answer." />
                    <input type="text" placeholder="Enter your answer here" />
                    <button className="btn waves-effect waves-light">Submit </button> 
                    <button className="quiz-creator-mcq-toggle-button btn">This plan did not work. I need a new plan </button> 


                    <h5>3. Plan 2 </h5> 
                    <textarea placeholder="What's the man/woman without a Plan B? Explain your new plan and execute it. If you obtain the solution, enter the answer." />
                    <input type="text" placeholder="Enter your answer here" />
                    <button className="btn waves-effect waves-light">Submit </button> 
                    <button className="quiz-creator-mcq-toggle-button btn">This plan did not work. I need a new plan </button> 

                    <h5>3. Analyze your solution </h5> 
                    <textarea placeholder="Congratulations on solving the problem! Look back on your problem-solving process. How could it be better?" />

                </div>
            </div>
        );

    }
});

var init = function() {

    React.render(
        <ProblemSolvingBox />, 
        document.getElementById("page-container")
    );

};

init();