SigninController = function () {
    this.view = null;
};

SigninController.prototype.init = function () {
    var This = this;
    new ScriptLoader(["/ui/js/user/SigninView.js",
                      "/lib/md5.js"],function () {
        this.view = new SigninView();
        var view = this.view;
        view.init();
        view.setController.call(this.view,This);
    });
};

SigninController.prototype.submit = function (action,data) {
    var password = data.password;
    data.password = md5(password); //TODO: RSA on top of the md5
    data.md5= true;
    $.post(action,data,ExternalWindow.windowCallback);
};