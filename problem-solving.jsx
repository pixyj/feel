var app = function() {

    var quizModel = new QuizModel({
        quizType: constants.SHORT_ANSWER,
        questionInput: "Hi There",
        questionDisplay: "If you are using  a distributed `NoSQL` database, can you provide `ACID` capabilities? ",
        answer: "12"
    });

    var shortAnswerModel = new ShortAnswerSubmitModel();
    var mcqAnswerModel = new MCQAnswerModel();

    var problemSolvingModel = new ProblemSolvingModel();
    //add an empty plan for the initial state of the app
    problemSolvingModel.plans.add(new PlanModel());

    return {
        quizModel: quizModel,
        shortAnswerModel: ShortAnswerSubmitModel,
        mcqAnswerModel: mcqAnswerModel,
        problemSolvingModel: problemSolvingModel
    };

}();

var GuessHistoryEmptyView = React.createClass({

    render: function() {
        return (
            <h6> You have not made any guesses, yet.</h6> 

        );
        
    }

});

var GuessHistorySingleView = React.createClass({
    
    getInitialState: function() {

        return {
            guess: null,
            result: null,
            when: null,
            plan: null
        };
    },

    render: function() {

        var when = prettyDate(new Date(this.props.timestamp));
        return (
            <a href="#!" className="collection-item">
                <div className="row">
                    <div className="col s3">  
                        <strong>{this.props.guess}</strong> 
                    </div>

                    <div className="col s3">  
                        <strong> {this.getResultFeedback()} </strong> 
                    </div>


                    <div className="col s3">  
                        <strong> {this.getPlanNumber()} </strong> 
                    </div>


                    <div className="col s3">  
                        <strong> {when} </strong> 
                    </div>

                </div> 
            </a>
        );
    },

    //todo -> avoid copy paste. 
    getResultFeedback: function() {
        return {
            false: constants.WRONG_FEEDBACK,
            true: constants.CORRECT_FEEDBACK,
            null: ""
        }[this.props.result];
    },

    getPlanNumber: function() {
        return this.props.planNumber || "On a whim";
    },
});

var GuessHistoryCollectionView = React.createClass({

    getInitialState: function() {
        return {
            guesses: [],
            isTimeElapsedCorrect: true
        }
    },

    componentDidMount: function() {
        this.props.guessCollection.on("add", this.updateViews, this);

        var delay = 1000 * 60; //1 minute; 
        var self = this;
        this.timer = setInterval(function() {
            self.updateGuessTimeElapsed();
        }, delay);
    },

    componentWillUnmount: function() {
        this.props.guessCollection.off("add", this.updateViews);
        clearInterval(this.timer);
    },

    render: function() {

        var rows = [];
        var i, length = this.props.guessCollection.length;

        for(i = 0; i < length; i++) {
            var attrs = this.props.guessCollection.at(i).attributes;
            var view = <GuessHistorySingleView 
                            guess={attrs.guess}
                            result={attrs.result}
                            timestamp={attrs.timestamp}
                            planNumber={attrs.planNumber}
                            key={i}

                        />
            rows.push(view);

        }

        return (

            <div className="collection" id="problem-solving-guess-collection">
                
                <a href="#!" className="collection-item" id="problem-solving-guess-collection-heading" ref="heading">
                    <div className="row">
                        <div className="col s3">  
                            <strong>Guess</strong> 
                        </div>

                        <div className="col s3">  
                            <strong> Result </strong> 
                        </div>

                        <div className="col s3">  
                            <strong> Plan </strong> 
                        </div>



                        <div className="col s3">  
                            <strong> When? </strong> 
                        </div>

                    </div> 
                </a>

                {rows}

            </div>

        );
    },

    updateViews: function() {
        return {
            guesses: this.props.guessCollection.toJSON()
        }
    },

    updateGuessTimeElapsed: function() {
        this.setState({
            isTimeElapsedCorrect: false
        });
    }
});

var GuessHistoryView = React.createClass({

    getInitialState: function() {
        return {
            guesses: []
        }
    },

    componentDidMount: function() {
        this.props.guessCollection.on("add", this.addGuess, this);
    },

    componentWillUnmount: function() {
        this.props.guessCollection.off("add", this.addGuess);
    },

    addGuess: function() {
        var guesses = this.props.guessCollection.toJSON();
        this.setState({
            guesses: guesses
        });
    },

    render: function() {

        var guessCollectionView;

        if(this.state.guesses.length === 0) {
            guessCollectionView = <GuessHistoryEmptyView />
        }
        else {
            guessCollectionView = <GuessHistoryCollectionView guessCollection={this.props.guessCollection} />
        }

        return (
            <div>
                <h5> Your Guesses: </h5>         
                {guessCollectionView}
            </div>
        );
    }
});

var addGuessToCollection = function(attrs) {
        
        attrs.timestamp = getUTCDate().getTime();
        attrs.planIndex = this.props.planIndex;

        this.props.model.guessCollection.add(attrs);
};


var PlanContentView = React.createClass({
    
    getInitialState: function() {
        return {
            planInput: this.props.model.planInput,
            planDisplay: this.props.model.planDisplay
        }
    },

    componentDidMount: function() {
        if(this.props.shouldFocus) {
            this.focus();
        }
    },

    render: function() {
        
        var planNumber = this.props.index + 1;
        var domId = "problem-solving-part-{0}".format(planNumber);
        var planDisplay = this.state.planDisplay

        return (
            
                <div className="row">
                    <div className="col s6">
                        <h6 className="problem-solving-plan-md-and-html-heading">
                            Markdown Input
                        </h6>

                        <textarea className="problem-solving-plan-md-input"
                                  placeholder="Explain your plan and execute it. If you obtain the solution, enter the answer below" 
                                  ref="textarea" 
                                  onKeyUp={this.updateContent} 
                                  onChange={this.updateContent} 
                                  value={this.state.planInput} 

                        />
                    </div>
                    <div className="col s6">
                        <h6 className="problem-solving-plan-md-and-html-heading">
                            HTML Preview
                        </h6>
                        <div dangerouslySetInnerHTML={{__html: planDisplay}} />
                    </div>
                </div>

        );
    },

    updateContent: function(evt) {
        var input = evt.target.value;
        var display = mdAndMathToHtml(input);
        
        var state = {
            planInput: input,
            planDisplay: display
        };

        this.props.model.set(state);

        this.setState(state);

    },



});

var PlanSingleView = React.createClass({


    render: function() {
        
        var planNumber = this.props.index + 1;
        var domId = "problem-solving-part-{0}".format(planNumber);

        return (
            
            <div id={domId} className="problem-solving-single-plan-container">

                
                <div>
                    <span className="problem-solving-plan-heading"> Plan {planNumber}: </span>
                    <span> Need any ideas? See <a href="https://en.wikipedia.org/wiki/How_to_Solve_It"> How to solve it</a> </span>
                </div>

                <hr /> 

                <PlanContentView model={this.props.model} />

                <h5> Your Guess? </h5>

                <QuizAnswerSubmitView model={this.props.quizModel} planNumber={planNumber} />
                
                <button className="problem-solving-create-plan-btn btn" 
                        onClick={this.addPlan}>
                    
                        This plan did not work. I need a new plan 

                </button> 


            </div>
        );
    },



    addPlan: function() {
        this.props.model.collection.add(new PlanModel());
    },

    focus: function() {
        this.refs.textarea.getDOMNode().focus();
    }
});

var PlanCollectionView = React.createClass({


    getInitialState: function() {
        return {
            plans: []
        }
    },

    getPlanCollection: function() {
        return this.props.problemSolvingModel.plans;
    },

    componentDidMount: function() {
        this.getPlanCollection().on("add", this.addPlan, this);        
    },  

    componentWillUnmount: function() {
        this.getPlanCollection().off("add", this.addPlan);
    },

    render: function() {

        var rows = [];
        var plans = this.getPlanCollection();
        var i, length = plans.length;
        for(i = 0; i < length; i++) {
            var model = plans.at(i);    
            var shouldFocus = ( (length != 1) && (i === length - 1) );
            var view = <PlanSingleView 
                            model={model} 
                            quizModel={this.props.quizModel}
                            key={i} 
                            index={i} 
                            ref={i} 
                            shouldFocus={shouldFocus}
                            />
            rows.push(view);
        }

        return (
            <div className="problem-solving-plan-collection">
                {rows}
            </div>
        );
    },

    addPlan: function() {
        var jsonPlans = this.getPlanCollection().toJSON();
        this.setState({
            plans: jsonPlans
        });

    }

});


var ProblemSolvingBox = React.createClass({

    getInitialState: function() {
        return {
            quizModel: app.quizModel,
            shortAnswerModel: app.shortAnswerModel,
            mcqAnswerModel: app.mcqAnswerModel,
            problemSolvingModel: app.problemSolvingModel
        };
    },

    render: function() {

        var quizHeading = "The problem";
        var solveItHeading = "Let's solve it";


        return (
            <div>

                {/* Top Heading */}
                <div className="row">
                    
                    <div className="col s6">
                        <h4 className="problem-solving-top-header"> {quizHeading} </h4>
                    </div>
                    <div className="col s6">
                        <h4 className="problem-solving-top-header"> {solveItHeading} </h4>
                    </div>
                </div>

                {/* Problem Definition | Solve It */}
                <div className="row problem-solving-question-and-solve-it-container">

                    <div className="col s6">
                        <QuizQuestionView questionDisplay={this.state.quizModel.attributes.questionDisplay} />
                    </div>

                    <div className="col s6">

                        <ol id="problem-solving-steps-list">

                            <li > <a href="#problem-solving-understand-the-problem"> Understand the Problem </a> </li>
                            <li> Come up with a plan and execute it </li>
                            <li> Analyze your solution </li> 
                        </ol>

                        <GuessHistoryView guessCollection={this.state.quizModel.guessCollection} />

                    </div>
                </div>
                
                {/* Understanding, Plans and Analysis */}
                <div>

                    <div id="problem-solving-understand-the-problem">
                        <h5>Understand the problem </h5> 
                        <textarea placeholder="State the problem in your own words and ensure you have understood the problem correctly" />
                    </div>

                    <PlanCollectionView problemSolvingModel={this.state.problemSolvingModel} 
                                        quizModel={this.state.quizModel}
                                        guessCollection={this.state.quizModel.guessCollection} 

                    />
                    
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