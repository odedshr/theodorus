Theodorus.namespace("feed").AddTopicController =  Class.extend({
    init: function (parent) {
        this.parent = parent;
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
                alert ("refreshing the feed not yet implemented. please refresh manually");
            }
        });
    },

    isSlugAvailable: function (slug, callback) {
        if (slug.length===0) {
            callback({"result":"slug-is-too-short"});
        } else if (Topic.isSlugValid(slug)) {
            //TODO: check server side if it's actually available!!
            callback({"result":"slug-is-available"});
        } else {
            callback({"result":"slug-is-invalid"});
        }
    },

    URLPrefix: function () {
        return document.URL.match(/^http[s]?:\/\/[a-zA-Z0-9\.\-_]*(:(\d)*)?\//)[0] + "*";
    },

    me: function () {
        return this.parent.me();
    }
});