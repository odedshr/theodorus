Theodorus.namespace("user").SigninController =  Class.extend({
    init: function (io) {
        this.parent = io;
        this.view = new Theodorus.user.SigninView();
        this.view.setController(this);
        this.callback = ExternalWindow.windowCallback;

        $.getScript("/lib/md5.js", function () {});

        _.bindAll(this,"submit");
    },

    submit: function (action,data) {
        var This = this;
        var password = data.password;
        data.password = md5(password); //TODO: RSA on top of the md5
        data.md5= true;
        $.post(action,data, function (output) {
            if (!output.error) {
                This.view.cancel();
                This.callback(output);
            } else {
                console.error(output.error);
            }

        });
    }
});