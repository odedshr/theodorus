Theodorus.namespace("feed").TagCloudController = Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.feed.TagCloudView();
        this._super(io);
        this.collection = new Tags();
        io.getTagColor = this.getTagColor.bind(this);
        _.bindAll(this,"load","selectTag","render","getTagColor");
    },

    load: function (callback) { //{data: {page: 3}
        var This = this,
            after = function () { This.render(callback);};
        this.collection.fetch({
            reset:true,
            success:after,
            error:after
        });
    },

    getTagColor:function (tag) {
        var defaultColor = new Tag();
        var tagElement = this.collection.findWhere({"tag":tag});
        return (tagElement ? tagElement: defaultColor).get("color") ;
    },

    selectTag: function(tag) {
        alert ("tag selection not implemented");
    }
});
