Theodorus.namespace("feed").FeedController =  Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.feed.FeedView();
        this._super(io);

        _.bindAll(this, "openAddTopicWindow","refreshTopicList","reload");

        this.account = new Theodorus.user.AccountController(io);
        this.topics = new Theodorus.feed.TopicListController(io);
        this.tags = new Theodorus.feed.TagCloudController(io);

        // init sub units
        /*
         * SearchController
         * AddTopicController
         * SearchController
         * TagCloudController
         *
         * */
     },

    setup: function () {
        var This = this;
        this.view.setup(function () {
            This.account.setup();
            This.topics.setup();
            This.tags.setup();
            This.tags.load(function () {
                This.topics.load();
            });
        });
    },

    openAddTopicWindow: function () {
        this.addTopic = new Theodorus.feed.AddTopicController(this.io);
        this.addTopic.view.setAsPopUp(true);
        this.addTopic.render();
    },

    refreshTopicList: function () {
        this.topics.load();
    },

    reload: function () {
        this.refreshTopicList();
        //this.refreshTags();
    }
});

