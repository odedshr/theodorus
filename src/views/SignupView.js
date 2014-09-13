Theodorus.namespace("user").SignupView = Theodorus.View.extend({
    el : "#main",

    initialize : function () {
        _.bindAll(this,"render","setup","onsubmit","cancel");
    },

    render : function(callback) {
        var This = this;
        this.transform("<signup />", function (output) {
            This.setup();
            if (callback) {
                callback(This,output);
            }
        });
        return this;
    },

    setup : function (callback) {
        document.getElementById("form_signup").onsubmit = this.onsubmit;
        document.getElementById("button-cancel").onclick = this.cancel;
        //TODO: add verify password complexity

        return Theodorus.View.prototype.setup.call(this,callback);
    },

    onsubmit : function (event) {
        try {
            var This = this;
            this.controller.io.notify("info","sending-data");
            this.controller.submit(event.target.action,getFormFields(event.target), function (result) {
                This.controller.io.notify("error",result.error);
            });
        }
        catch (err) {
            alert (err);
        }
        return false;
    },

    cancel : function () {
        document.getElementById("form_signup").remove();
        return false;
    }
});