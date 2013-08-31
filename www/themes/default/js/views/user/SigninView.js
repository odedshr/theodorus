Theodorus.namespace("user").SigninView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#main");

        /*if (document.getElementById("form_signin")) {
            this.setup();
        } else {
            this.render();
        }*/
        _.bindAll(this,"render","setup","onsubmit","cancel");
    },

    render : function(callback) {
        var This = this;
        this.transform("<signin />", function () {
            This.setup();
            if (callback) {
                return callback(This);
            }
        });
        return this;
    },

    setup : function (callback) {
        document.getElementById("form_signin").onsubmit = this.onsubmit;
        document.getElementById("button-cancel").onclick = this.cancel;
        if (callback){
            callback(this);
        }
    },

    onsubmit : function (event) {
        transform($("#messages"),"<message type='info' message='authenticating' />");
        this.controller.submit(event.target.action,getFormFields(event.target), function () {
            if (result.error) {
                transform($("#messages"),"<message type='error' message='"+result.error+"' />");
            }
        });
        return false;
    },

    cancel : function () {
        document.getElementById("form_signin").remove();
        return false;
    }
});