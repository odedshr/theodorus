Theodorus.namespace("feed").FeedController =  Class.extend({
    init: function (io) {
        _.bindAll(this, "openAddTopicWindow","refreshTopicList");

        this.io = io;
        this.view = new Theodorus.feed.FeedView();
        this.view.setController(this);

        this.account = new Theodorus.user.AccountController(io);
        this.topics = new Theodorus.feed.TopicListController(io);

        // init sub units
        /*
         * SearchController
         * AddTopicController
         * SearchController
         * TagCloudController
         *
         * */
     },

    render: function () {
        var This = this;
        this.view.render(function () {
            This.account.view.setup();
            This.topics.load();
        });
    },

    openAddTopicWindow: function () {
        this.addTopic = new Theodorus.feed.AddTopicController(io);
        this.addTopic.view.setAsPopUp(true);
        this.addTopic.view.render();
    },

    refreshTopicList: function () {
        this.topics.load();
    }
});

