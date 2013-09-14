Theodorus.namespace("feed").TagCloudController = Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.feed.TagCloudView();
        this._super(io);
        this.collection = new Tags();
        _.bindAll(this,"load","selectTag","render");
    },

    load: function () { //{data: {page: 3}
        this.collection.fetch({
            reset:true,
            success:this.render,
            error:this.render
        });
    },

    selectTag: function(tag) {
        alert ("tag selection not implemented");
    }
});
