Theodorus.namespace("feed").TopicListView = Theodorus.View.extend({
    el: "#topics",
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
        $(".topic .title").click(this.titlePressed.bind(this));
        $(".button-action").click(this.actionPressed.bind(this));

        return Theodorus.View.prototype.setup.call(this,callback);
    },

    titlePressed: function (event) {
        this.controller.openTopic(event.target.href, event.target.innerHTML);
        return false;
    },

    actionPressed: function (event) {
        var href = event.target.href;
        this.controller.sendFeedback(href, function (output) {
            if (output.error) {
                alert (output.error);
            } else {
                var jObj = $(event.target),
                    newHref = href.substr(0,href.lastIndexOf("/"))+"/"+(jObj.is(".pressed")?"":"un")+output.key,
                    value = output.value;
                jObj.toggleClass("pressed").attr("href",newHref).children(".count").html(value>0 ? value : "");
            }
        });
        return false;
    }
});