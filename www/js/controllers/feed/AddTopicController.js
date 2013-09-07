Theodorus.namespace("feed").AddTopicController =  Class.extend({
    init: function (io) {
        this.io = io;
        this.view = new Theodorus.feed.AddTopicView();
        this.view.setController(this);
    },

    submit: function (action,data, callback) {
        //TODO: validate data prior sending, not need to check slug availability
        var This = this;
        $.post(action,data,function (result) {
            callback(result);
            if (!result.error) {
                This.view.close();
                This.io.refreshFeed();
            }
        });
    },

    isSlugAvailable: function (slug, callback) {
        if (slug.length===0) {
            callback({"result":"slug-is-too-short"});
        } else if (Topic.isSlugValid(slug)) {
            $.get("/*"+slug+"/exists",function(output) {
                callback(output);
            });
        } else {
            callback({"result":"slug-is-invalid"});
        }
    },

    URLPrefix: function () {
        var matches = document.URL.match(/^http[s]?:\/\/[a-zA-Z0-9\.\-_]*(:(\d)*)?\//);
        return matches[0] + "*";
    }
});