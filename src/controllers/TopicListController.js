Theodorus.namespace("feed").TopicListController =  Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.feed.TopicListView();
        this._super(io);
        this.isLoading = false;
        this.isAllLoaded = false;
        this.collection = new Topics();
        this.collection.setPage(1);
        _.bindAll(this,"load","loadCallback","openTopic");
    },

    loadCallback: function(collection, response) { // collection, response, options
        var io = this.io,
            numberOfItems = collection.length,
            numberOfNewItems = response.length;

        if (!numberOfNewItems) {
            this.isAllLoaded = true;
        }
        this.isLoading = false;
        while (numberOfNewItems--) {
            var model = collection.at(numberOfItems-numberOfNewItems-1);
            var value = model.get("user_id");
            if (typeof value == "object") {
                model.set("initiator",new User(value));
            }
            value = model.get("tags");
            if (typeof value == "object") {
                var tags = new Tags();
                for (var i in value) {
                    tags.add({"tag":value[i], "color":io.getTagColor(value[i])});
                }
                model.set("tags",tags);
            }
        }
        this.render();
    },

    load: function () {
        if (!this.isAllLoaded && !this.isLoading) {
            this.isLoading = true;
            this.collection.fetch({
                method:'add',
                success:this.loadCallback,
                error:this.loadCallback
            });
        }
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
    },

    reload: function () {
        this.collection.setPage(1);
        this.isAllLoaded = true;
        this.load();
    },

    nextPage: function () {
        if (this.collection.length && !this.isAllLoaded && !this.isLoading) {
            this.collection.setPage(this.collection.getPage()+1);
            this.load();
        }
    }
});