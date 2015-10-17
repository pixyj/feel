var app = {
    collection: new QuizBankCollection()
};

var QuizSnippetView = React.createClass({

    render: function() {
        return (
            <div className="quiz-filter-question"
                dangerouslySetInnerHTML={{__html: this.props.questionDisplay}} 
                onClick={this.selectQuiz} />
        )
    },

    selectQuiz: function() {
        console.log("Selected quiz");
    }
});

var QuizListBox = React.createClass({

    getInitialState: function() {

        return {
            quizzes: app.collection.getCachedQuizzes(),
            filterInput: ""
        };

    },

    render: function() {

        var rows = [];
        var length = this.state.quizzes.length;
        for(var i = 0; i < length; i++) {
            var attrs = this.state.quizzes[i];
            var view = <QuizSnippetView questionDisplay={attrs.questionDisplay} />
            rows.push(view); 
        };

        var inputId = "input-" + getUniqueId();

        return (
            <div>
                
                <h3> Hi There </h3>
                <div className="input-field">
                    <input  type="text" 
                            id={inputId}
                            value={this.state.filterInput}
                            onKeyUp={this.filterQuizzes} 
                            onChange={this.filterQuizzes} />
                    <label htmlFor={inputId}>Filter Questions</label>
                </div>
                {rows}
            </div>
        );  
    },

    filterQuizzes: function(evt) {
        var value = evt.target.value;
        if(!value.length) {
            this.setState({
                quizzes: app.collection.getCachedQuizzes(),
                filterInput: ""
            });
        }
        else {

            var notValidChars = /[^a-zA-Z0-9 ]/g; //Internationalization out of the window
            var sanitizedInput = value.replace(notValidChars, "").toLowerCase();
            var quizzes = _.filter(app.collection.getCachedQuizzes(), function(q) {
                return q.questionInputLowerCase.indexOf(sanitizedInput) !== -1;
            });
            this.setState({
                quizzes: quizzes,
                filterInput: value
            });    
        }
    }

});

var cacheQuizInputsAndRenderPage = function() {
    app.collection.cacheQuizInputs();
    React.render(
        <QuizListBox />, 
        document.getElementById("quiz-list-container")
    );
};

var fetchQuizzes = function() {
    app.collection.once("sync", this.cacheQuizInputsAndRenderPage);
    app.collection.fetch();
};

var init = function() {

    fetchQuizzes();

};

init();