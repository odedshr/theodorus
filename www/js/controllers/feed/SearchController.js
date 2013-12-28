Theodorus.namespace("feed").SearchController = Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.feed.SearchView();
        this._super(io);
    }
});