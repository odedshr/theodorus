Theodorus.namespace("feed").FeedController =  Class.extend({
    init: function (parent) {
        _.bindAll(this, "openAddTopicWindow");

        this.parent = parent;
        this.view = new Theodorus.feed.FeedView();
        this.view.setController(this);

        this.account = new Theodorus.user.AccountController(this);
        this.topics = new Theodorus.feed.TopicListController(this);

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
        this.addTopic = new Theodorus.feed.AddTopicController(this);
        this.addTopic.view.setAsPopUp(true);
        this.addTopic.view.render();
    },

    me: function () {
        return this.parent.me();
    }
});

