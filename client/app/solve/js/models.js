var PlanModel = Backbone.Model.extend({

    defaults: {
        planInput: "",
        planDisplay: "",
    },

    //idAttribute: "planInput" -> Well, it's ok to have a plan in mind and not explictly write it, I guess. Especially for new users. 

});

var PlanCollection = Backbone.Collection.extend({
    
    model: PlanModel

});

var ProblemSolvingModel = Backbone.Model.extend({

    defaults: {
        understandProblemInput: "",
        understandProblemDisplay: "",
        result: null    
    },


    initialize: function() {
        this.plans = new PlanCollection();
    }

});

module.exports = {
    PlanModel: PlanModel,
    PlanCollection: PlanCollection,
    ProblemSolvingModel: ProblemSolvingModel
};