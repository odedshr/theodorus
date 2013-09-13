Theodorus.namespace("topic").TopicView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#topic");
        _.bindAll(this,"setup");
    },

    render : function(callback) {
        var This = this;
        /*var after = function (obj) {
            This.setup();
            if (callback){
                callback(This,obj);
            }
        };*/
        //this.transform("<addTopic prefix='"+this.controller.URLPrefix()+"'/>",after);
        return this;
    },

    setup: function (callback) {
        if (callback){
            callback();
        }
        return this;
    }

});