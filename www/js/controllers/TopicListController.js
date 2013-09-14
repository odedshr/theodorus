Theodorus.namespace("feed").TopicListController =  Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.feed.TopicListView();
        this._super(io);
        this.collection = new Topics();
        _.bindAll(this,"load","loadCallback","openTopic");
    },

    loadCallback: function() { // collection, response, options
        this.collection.models.forEach(function (model) {
            var value = model.get("initiator");
            if (typeof value == "object") {
                model.set("initiator",new User(value));
            }
        });
        this.render();
    },

    load: function () { //{data: {page: 3}
        this.collection.fetch({
            reset:true,
            success:this.loadCallback,
            error:this.loadCallback
        });
    },

    sendFeedback: function(action, callback) {
        $.get(action,function(output){
            callback(output ? output : {"error":"no-result"});
        });
    },

    openTopic: function (url,title, callback) {
        this.io.openPage(url,title,function () {
            if (callback) {
                callback();
            }
        });
    }
});