Theodorus.namespace("topic").TopicView = Theodorus.View.extend({
    el: "#main",

    initialize : function () {
        _.bindAll(this,"setup");
    },

    render : function(callback) {
        var self = this,
            topic = this.controller.topic,
            user = this.controller.io.user;
        var xml = "<page type=\"topicView\">"+
            "<url>"+encodeURI(location.href)+"</url>"+
            user.xml()+
            (topic ? topic.xml() : "<topicLoading />")+
            "</page>";
        console.log(location.href);
        console.log(decodeURI(location.href));
        console.log(encodeURI(location.href));

        console.log(xml);
        this.transform(xml,function (output) {
            if (callback){
                callback(self, output);
            }
        });
        return this;
    },

    setup: function (callback) {
        // need to use $() and not getElementById because it might not exist
        $("#link_suggest_topic").click(this.openAddTopicWindow);

        return Theodorus.View.prototype.setup.call(this,callback);
    }

});