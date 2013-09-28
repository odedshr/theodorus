Theodorus.namespace("feed").TopicListView = Theodorus.View.extend({
    el: "#topics",
    window:$(window),
    jScroller: window,
    jWrapper:$(document),
    initialize : function () {
        this.window.resize(this.widthChanged.bind(this));
    },

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
        $(".topic .title").off('click').click(this.titlePressed.bind(this));
        $(".button-action").off('click').click(this.actionPressed.bind(this));
        this.jScroller.scroll(this.listScrolled.bind(this));
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
    },

    listScrolled: function () {
        if (this.jScroller.scrollTop()<-100) {
            this.controller.reload();
        } else if (((this.jScroller.scrollTop()+this.jScroller.height())/this.jWrapper.height()) > 0.86) {
            this.controller.nextPage();
        }
    },

    widthChanged: function () {
        //console.log(this.$el.width());
    }
});