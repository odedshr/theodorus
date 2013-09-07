var MIN_PASSWORD_LENGTH = 3;

Theodorus.namespace("user").SignupController =  Class.extend({
    init: function (io) {
        this.parent = io;
        this.view = new Theodorus.user.SignupView();
        this.view.setController(this);
        this.callback = ExternalWindow.windowCallback;

        $.getScript("/lib/md5.js", function () {});

        _.bindAll(this,"submit");
    },

    submit: function (action,data) {
        var password =data.password,
            passwordRepeat =data.password_repeat;
        if (!data.terms_of_use) {
            return {"error":"terms-of-use-not-approved"};
        } else if (password != passwordRepeat) {
            return {"error":"passwords-dont-match"};
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            return {"error":"passwords-too-short"};
        } else if (this.verifyPasswordComplexity(password)<1) {
            return {"error":"passwords-too-simple"};
        } else{
            data.password = md5(password); //TODO: RSA on top of the md5
            data.password_repeat = md5(passwordRepeat);
            data.md5 = true;
            $.post(action,data,function (output) {
                if (!output.error) {
                    This.view.cancel();
                    This.callback(output);
                } else {
                    console.error(output.error);
                }

            });
            return {};
        }
    },

    verifyPasswordComplexity : function (password) {
        if (/(?=^.{8,}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(password)) {
            return 4; //console.log ("password is Super Secure Complex Password");
        } else if (/(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(password)) {
            return 3; //console.log ("password is complex");
        } else if (/(?=^.{6,}$)(?=.*\d)(?=.*[A-Za-z]).*$/.test(password)) {
            return 2; //console.log ("password is moderate");
        } else if (/[a-zA-Z0-9\_\-]{3,}$/i.test(password)) {
            return 1; //console.log ("password is weak");
        } else {
            return 0; //console.log ("password is too weak");
        }
    }
});
