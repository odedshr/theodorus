Theodorus.namespace("feed").TagController =  Class.extend({
    init: function (io) {
        this.io = io;
        this.view = new Theodorus.feed.TagView();
        this.view.setController(this);
    },

    render: function (callback) {
        this.view.render(function () {
            if (callback) {
                callback();
            }
        });
    }
});