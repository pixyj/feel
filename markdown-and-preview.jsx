var MarkdownAndPreviewAttrs = {
    
    getInitialState: function() {
        return {
            input: "",
            display: ""        
        }
    },

    componentDidMount: function() {
        if(this.props.shouldFocus) {
            this.focus();
        }
    },

    render: function() {
        var display = this.state.display;

        return (
            
                <div className="row">
                    <div className="col s12 m6">
                        <h6 className="md-and-html-heading">
                            Markdown Input
                        </h6>

                        <textarea className="md-and-html-input"
                                  placeholder={this.props.placeholder} 
                                  ref="textarea" 
                                  onKeyUp={this.updateContent} 
                                  onChange={this.updateContent} 
                                  value={this.state.input} 

                        />
                    </div>

                    <div className="col s12 m6">
                        <h6 className="md-and-html-heading">
                            HTML Preview
                        </h6>
                        <div dangerouslySetInnerHTML={{__html: display}} />

                    </div>

                </div>

        );
    },

    updateContent: function(evt) {
        var input = evt.target.value;
        var display = mdAndMathToHtml(input);
        
        var state = {
            input: input,
            display: display
        };

        this.setState(state);
        this.afterUpdateContent(state);
    },


    afterUpdateContent: function() {
        //console.warn("Implement afterUpdateContent in the subclass if you want to save the details" );
            //optional. Implement in subclass if you want to. 
    }

}

