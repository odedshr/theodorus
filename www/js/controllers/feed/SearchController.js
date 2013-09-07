Theodorus.namespace("feed").SearchController =  Class.extend({
    init: function (io) {
        this.io = io;
        this.view = new Theodorus.feed.SearchView();
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