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
        this.transform("<signin />", function (output) {
            This.setup();
            if (callback) {
                callback(This,output);
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
        io.notify("info","authenticating");
        this.controller.submit(event.target.action,getFormFields(event.target), function () {
            io.notify("error",result.error);
        });
        return false;
    },

    cancel : function () {
        document.getElementById("form_signin").remove();
        return false;
    }
});