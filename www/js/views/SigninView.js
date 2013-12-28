Theodorus.namespace("user").SigninView = Theodorus.View.extend({
    el : "#main",

    initialize : function () {
        _.bindAll(this,"render","setup","onsubmit","cancel");
    },

    render : function(callback) {
        var This = this;
        console.log("render signinview 1");
        this.transform("<signin />", function (output) {
            console.log("render signinview 2");
            This.controller.io.notify("info","authenticating");
            console.log("render signinview 3");
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
        var io = this.controller.io;
        io.notify("info","authenticating");
        this.controller.submit(event.target.action, getFormFields(event.target), function (result) {
            io.notify("error",result.error);
            if (!result.error) {
                io.openPage(io.docURL);
            } else {
                alert (result.error);
            }
        });
        return false;
    },

    cancel : function () {
        document.getElementById("form_signin").remove();
        return false;
    }
});