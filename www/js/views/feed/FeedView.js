Theodorus.namespace("feed").FeedView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#main");
        _.bindAll(this,"openAddTopicWindow");
    },

    render : function(callback) {
        var This = this;
        var user = this.controller.io.user;
        var xml = "<page type=\"feed\">"+
                    user.xml()+
                    (user.can("suggest") ? "<addTopic/>" : "")+
                    "</page>";
        this.transform(xml,function () {
            This.setup();
            if (callback){
                callback(this);
            }
        });
        return this;
    },

    setup: function (callback) {
        // need to use $() and not getElementById because it might not exist
        $("#link_suggest_topic").click(this.openAddTopicWindow);
        if (callback){
            callback(this);
        }
    },

    openAddTopicWindow: function () {
        this.controller.openAddTopicWindow();
        return false;
    }
});