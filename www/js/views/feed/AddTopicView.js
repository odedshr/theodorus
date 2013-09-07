Theodorus.namespace("feed").AddTopicView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#add_topic");
        _.bindAll(this,"onsubmit","onSlugKeyUp","onTitleKeyUp","updateTitleCharsLeft","close","setup");
    },

    render : function(callback) {
        var This = this;
        var after = function (obj) {
            This.setup();
            if (callback){
                callback(This,obj);
            }
        };
        if (this.controller.io.user.can("suggest")) {
            this.transform("<addTopic prefix='"+this.controller.URLPrefix()+"'/>",after);
        } else {
            this.jElement.html("");
        }
        return this;
    },

    setup: function (callback) {
        this.titleCharsleft = $("#topic_title_chars_left");
        var titleField =document.getElementById("topic_title");
        this.updateTitleCharsLeft(titleField);
        titleField.onkeyup = this.onTitleKeyUp;
        document.getElementById("form_add_topic").onsubmit = this.onsubmit;
        document.getElementById("slug").onkeyup = this.onSlugKeyUp;
        document.getElementById("button_cancel").onclick = this.close;

        if (callback){
            callback();
        }
        return this;
    },

    updateTitleCharsLeft: function (titleField) {
        this.titleCharsleft.html(titleField.maxLength-titleField.value.length);
    },

    onTitleKeyUp : function (event) {
        this.updateTitleCharsLeft(event.target);
    },

    onSlugKeyUp : function(event) {
        var This = this;
        delay(function(){
            var jSlugResult = $("#topic_slug_result");
            if (event.target.value.length>0) {
                $("#topic_complete_slug").addClass("loading");
                This.controller.isSlugAvailable(event.target.value, function (output) {
                    jSlugResult.removeClass("loading");
                    transform(jSlugResult, "<slugTest result='"+output.result+"'/>");
                });
            } else {
                jSlugResult.html("");
            }
        }, 1000 );
    },

    onsubmit : function (event) {
        var jMessages = $("#messages")
        transform(jMessages,"<message type='info' message='sending-data' />");
        this.controller.submit(event.target.action, getFormFields(event.target), function (result) {
            if (result.error) {
                transform(jMessages,"<message type='error' message='"+result.error+"' />");
            } else {
                jMessages.html("");
            }
        });
        return false;
    },

    close : function () {
        document.getElementById("form_add_topic").remove();
        return false;
    }
});