Theodorus.namespace("user").SigninView = Theodorus.View.extend({
    el : "#main",

    initialize : function () {
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

        return Theodorus.View.prototype.setup.call(this,callback);
    },

    onsubmit : function (event) {
        var This = this;
        this.controller.io.notify("info","authenticating");
        this.controller.submit(event.target.action,getFormFields(event.target), function (result) {
            This.controller.io.notify("error",result.error);
        });
        return false;
    },

    cancel : function () {
        document.getElementById("form_signin").remove();
        return false;
    }
});