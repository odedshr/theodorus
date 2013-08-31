Theodorus.namespace("user").AccountView = Theodorus.View.extend({
    initialize : function () {
        this.setElement("#account");
        _.bindAll(this,"openAuthenticationWindow");
    },

    render : function(callback) {
        var This= this;
        this.transform(this.controller.user(),function () {
            This.setup();
            if (callback){
                callback();
            }
        });
        return this;
    },

    setup: function (callback) {
        var This = this;
        //var authenticate = function (event) { return !This.controller.authenticate(event.target.href); };
        // I use $() and not getElementById because they might not exist
        $("#btn_signup").click( this.openAuthenticationWindow);
        $("#btn_signin").click( this.openAuthenticationWindow);
        $("#btn_signout").click( function () { return !This.controller.signout(); });
        if (callback){
            callback();
        }
    },

    openAuthenticationWindow: function (event) {
        this.controller.openAuthenticationWindow("signin"==event.target.id.replace(/btn_/,""));
        return false;
    }
});