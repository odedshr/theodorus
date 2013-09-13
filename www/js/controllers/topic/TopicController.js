Theodorus.namespace("topic").TopicController =  Theodorus.AbstractController.extend({
    init: function (io) {
        this.view = new Theodorus.topic.TopicView();
        this._super(io);
    }
});