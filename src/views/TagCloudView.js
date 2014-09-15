Theodorus.namespace("feed").TagCloudView = Theodorus.View.extend({
    el: "#tags",
    initialize : function () {},

    render : function(callback) {
        var This = this;
        this.transform(this.controller.collection.xml(),function (output) {
            This.setup();
            if (callback) {
                callback(This,output);
            }
        });
        return this;
    },

    setup: function (callback) {
        $(".tag").click(this.tagPressed.bind(this));

        return Theodorus.View.prototype.setup.call(this,callback);
    },

    tagPressed: function (event) {
        this.controller.selectTag(event.target.href, event.target.innerHTML);
        return false;
    }
});