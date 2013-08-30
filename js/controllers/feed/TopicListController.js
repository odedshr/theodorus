Theodorus.namespace("feed").TopicListController =  Class.extend({
    init: function (parent) {
        this.parent = parent;
        this.view = new Theodorus.feed.TopicListView();
        this.view.setController(this);
        this.collection = new Topics();
        _.bindAll(this,"load","loadCallback");
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

    render: function () {
        this.view.render();
    },

    me: function () {
        return this.parent.me();
    }
});