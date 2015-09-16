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
            <div></div> 

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
                    <div className="col s4">  
                        <strong>{this.props.guess}</strong> 
                    </div>

                    <div className="col s4">  
                        <strong> {this.getResultFeedback()} </strong> 
                    </div>

                    <div className="col s4">  
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

        //Is it a good practice to set state directly? 
        this.state.isTimeElapsedCorrect = true;


        var rows = [];
        var guesses = this.getFilteredGuesses();
        var i, length = guesses.length;

        for(i = 0; i < length; i++) {
            var attrs = guesses[i];
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

                {rows}

            </div>

        );
    },

    //WTF. #todo There must be a better way to filter models and return their attributes. 
    getFilteredGuesses: function() {

        var models = this.props.guessCollection.where({
                                    planNumber: this.props.planNumber
                                });
        var jsonModels = _.map(models, function(m) {
            return m.toJSON();
        });

        console.debug("guesses for plan ", this.props.planNumber, jsonModels);
        return jsonModels;
    },

    updateViews: function() {
        
        return {
            guesses: this.getFilteredGuesses()
        };

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
            guessCollectionView = <GuessHistoryCollectionView 
                                        guessCollection={this.props.guessCollection} 
                                        planNumber={this.props.planNumber}
                                    />
        }

        return (
            <div>       
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

var UnderstandProblemViewAttrs = _.extend(MarkdownAndPreviewAttrs, {
});

var UnderstandProblemView = React.createClass(UnderstandProblemViewAttrs);

var PlanContentViewAttrs = _.extend(_.clone(MarkdownAndPreviewAttrs), {

    getInitialState: function() {
        return {
            input: this.props.model.planInput,
            display: this.props.model.planDisplay
        }
    },

    afterUpdateContent: function(state) {
        this.props.model.set({
            planInput: state.input,
            planDisplay: state.display
        });
    }

});


var PlanContentView = React.createClass(PlanContentViewAttrs);

var PlanSingleView = React.createClass({


    render: function() {
        
        var planNumber = this.props.index + 1;
        var domId = "problem-solving-part-{0}".format(planNumber);

        return (
            
            <div id={domId} className="problem-solving-single-plan-container">

                
                <div>
                    <span className="problem-solving-plan-heading"> Plan {planNumber}: </span>
                    <span> Need any ideas? See <a href="https://en.wikipedia.org/wiki/How_to_Solve_It" target="_blank"> 
                                                    How to solve it
                                                </a> 
                    </span>
                </div>

                <hr /> 

                <PlanContentView model={this.props.model} />

                <h5> Your Guess? </h5>

                <QuizAnswerSubmitView model={this.props.quizModel} planNumber={planNumber} />

                <GuessHistoryView guessCollection={this.props.quizModel.guessCollection} 
                                  planNumber={planNumber}
                />
                
                <button className="problem-solving-create-plan-btn btn" 
                        onClick={this.addPlan}>
                    
                        I have a new plan!

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
            
            //convoluted way of saying you should not focus on page load when there is just one plan,
            //but if there is more than one plan, then focus on the last one
            //https://news.ycombinator.com/item?id=4382045 #todo
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

var AnalysisContentView = React.createClass(_.clone(MarkdownAndPreviewAttrs), {

});

var AnalysisView = React.createClass({

    getInitialState: function() {

        return {
            mdInput: "",
            display: "",
            answeredCorrectly: false            
        };
    },

    componentDidMount: function() {
        this.props.guessCollection.on("answeredCorrectly", this.updateAnsweredCorrectly, this);
    },

    componentWillUnmount: function() {
        this.props.guessCollection.off("answeredCorrectly", this.updateAnsweredCorrectly);
    },

    render: function() {
        
        if(!this.state.answeredCorrectly) {
            return <div> </div>
        }

        return (
            <div>
                <h5> Your Analysis </h5>
                <AnalysisContentView 
                    placeholder="This was quite a ride. How could it be better? Can your method be used elsewhere? " />
            </div>
        );
    },

    updateAnsweredCorrectly: function() {
        this.setState({
            answeredCorrectly: true
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

                {/* Problem Definition | Solve It */}
                <div className="row problem-solving-question-and-solve-it-container">

                    <div className="col s12 m6">
                        <h4 className="problem-solving-top-header"> {quizHeading} </h4>
                        <QuizQuestionView questionDisplay={this.state.quizModel.attributes.questionDisplay} />
                    </div>

                    <div className="col s12 m6">
                        <h4 className="problem-solving-top-header"> {solveItHeading} </h4>
                        <ol id="problem-solving-steps-list">

                            <li > <a href="#problem-solving-understand-the-problem"> Understand the Problem </a> </li>
                            <li> Come up with a plan and execute it </li>
                            <li> Analyze your solution </li> 

                        </ol>

                    {/* #todo. Come up with a better line about incubation */ }
                        <h6>Exhausted? Take a break and come back later </h6>

                    </div>
                </div>
                
                {/* Understanding, Plans and Analysis */}
                <h5>Understand the problem </h5> 
                
                <UnderstandProblemView placeholder="State the problem in your own words and ensure you have understood the problem correctly"/>
                
                <PlanCollectionView problemSolvingModel={this.state.problemSolvingModel} 
                                    quizModel={this.state.quizModel}
                                    guessCollection={this.state.quizModel.guessCollection} 

                />

                <AnalysisView guessCollection={this.state.quizModel.guessCollection} />
                    

            </div>
        );

    }
});

var init = function() {

    ok = React.render(
        <ProblemSolvingBox />, 
        document.getElementById("page-container")
    );

};

init();