Theodorus.namespace("user").SignupView = Theodorus.View.extend({
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
        if (callback){
            callback();
        }
    },

    onsubmit : function (event) {
        io.notify("info","sending-data");
        this.controller.submit(event.target.action,getFormFields(event.target), function (result) {
            io.notify("error",result.error);
        });
        return false;
    },

    cancel : function () {
        document.getElementById("form_signup").remove();
        return false;
    }
});