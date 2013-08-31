Theodorus.namespace("feed").TopicListView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#topics");
    },

    render : function(callback) {
        var This = this;
        this.transform(this.controller.collection.xml(),function (output) {
            This.setup();
            if (callback){
                callback();
            }
        });
        return this;
    },

    setup: function (callback) {
        if (callback){
            callback();
        }
    }
});