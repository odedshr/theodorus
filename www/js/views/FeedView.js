Theodorus.namespace("feed").FeedView = Theodorus.View.extend({
    el: "#main",

    initialize : function () {
        _.bindAll(this,"openAddTopicWindow","setup","render");
    },

    render : function(callback) {
        var This = this,
            user = this.controller.io.user;
        var xml = "<page type=\"feed\">"+
                    user.xml()+
                    (user.can("suggest") ? "<addTopic/>" : "")+
                    "</page>";
        this.transform(xml,function (output) {
            if (callback){
                callback(This, output);
            }
        });
        return this;
    },

    setup: function (callback) {
        // need to use $() and not getElementById because it might not exist
        $("#link_suggest_topic").click(this.openAddTopicWindow);

        return Theodorus.View.prototype.setup.call(this,callback);
    },

    openAddTopicWindow: function () {
        this.controller.openAddTopicWindow();
        return false;
    }
});