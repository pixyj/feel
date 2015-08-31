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
        var quizHeading = "Here's the problem";
        var statusHeading = "Let's solve it";
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

                            <li > <a href="#problem-solving-understand-the-problem"> Understand the Problem </a> </li>
                            <li> <a href="#problem-solving-plan-1">Come up with a plan and execute it </a> </li>
                            <li> Analyze your solution </li> 
                        </ol>
                        <h5> Your progress </h5> 
                              <div className="collection">

                                <a href="#!" className="collection-item">
                                    <div className="row">
                                        <div className="col s4">  
                                            <strong>Guess</strong> 
                                        </div>

                                        <div className="col s4">  
                                            <strong> Result </strong> 
                                        </div>


                                        <div className="col s4">  
                                            <strong> When? </strong> 
                                        </div>

                                    </div> 
                                </a>

                                <a href="#!" className="collection-item">
                                    <div className="row">
                                        <div className="col s4">  
                                            <strong>None. You moved on to the next plan</strong> 
                                        </div>

                                        <div className="col s4">  
                                            <strong> Nope </strong> 
                                        </div>


                                        <div className="col s4">  
                                            <label> 10 minutes ago, based on Plan 1 </label> 
                                        </div>

                                    </div> 
                                </a>

                                <a href="#!" className="collection-item">
                                    <div className="row">
                                        <div className="col s4">  
                                            <strong>None. You moved on to the next plan</strong> 
                                        </div>

                                        <div className="col s4">  
                                            <strong> Nope </strong> 
                                        </div>


                                        <div className="col s4">  
                                            <label> 10 minutes ago, based on Plan 1 </label> 
                                        </div>

                                    </div> 
                                </a>


                              </div>

                    </div>

                </div>

                <div>

                    <div id="problem-solving-understand-the-problem">
                        <h5>1. Understand the problem </h5> 
                        <textarea placeholder="State the problem in your own words and ensure you have understood the problem correctly" />
                    </div>
                    
                    <div id="problem-solving-plan-1">
                        <h5>3. Plan 1 </h5> 
                        <span> Need any ideas?See <a href="https://en.wikipedia.org/wiki/How_to_Solve_It"> How to solve it</a>  </span>
                        <textarea placeholder="Explain your plan and execute it. If you obtain the solution, enter the answer." />
                        <input type="text" placeholder="Enter your answer here" />
                        <button className="btn waves-effect waves-light btn-large">Submit </button> 
                        <button className="problem-solving-create-plan-btn btn">This plan did not work. I need a new plan </button> 
                    </div>

                    <h5>3. Analyze your solution </h5> 
                    <textarea placeholder="Congratulations on solving the problem! Look back on your problem-solving process. How could it be better?" />
                    <button className="btn waves-effect waves-light">Done</button> 

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