Theodorus.namespace("user").SignupView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#main");

        /*if (document.getElementById("form_signup")) {
            this.setup();
        } else {
            this.render();
        }*/
        _.bindAll(this,"onsubmit","cancel");
    },

    render : function(callback) {
        this.transform("<signup />", function () {
            this.setup(callback);
        });
        return this;
    },

    setup : function (callback) {
        document.getElementById("form_signup").onsubmit = this.onsubmit.bind(this);
        document.getElementById("button-cancel").onclick = this.cancel;
        //TODO: add verify password complexity
        if (callback){
            callback();
        }
    },

    onsubmit : function (event) {
        transform($("#messages"),"<message type='info' message='sending-data' />");
        this.controller.submit(event.target.action,getFormFields(event.target), function (result) {
            if (result.error) {
                transform($("#messages"),"<message type='error' message='"+result.error+"' />");
            }
        });
        return false;
    },

    cancel : function () {
        document.getElementById("form_signup").remove();
        return false;
    }
});