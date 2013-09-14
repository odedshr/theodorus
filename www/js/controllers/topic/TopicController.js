Theodorus.namespace("topic").TopicController =  Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.topic.TopicView();
        this._super(io);
    }
});