Theodorus.namespace("topic").TopicController =  Theodorus.Controller.extend({
    topic: null,

    init: function (io) {
        this.view = new Theodorus.topic.TopicView();
        this._super(io);

        _.bindAll(this, "render","load");
    },

    render: function (callback) {
        var self = this;
        if (!this.topic) {
            this.load(function (result) {
                self.topic = (result.status == 404) ? new Notification(result) : new Topic(result);
                if (result) {
                    self.render();
                }
            });
        }
        this._super(callback);
    },

    load: function (callback) {
        $.get("/"+this.io.docURL, callback).fail(callback);
    }
});