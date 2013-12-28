Theodorus.namespace("user").AccountController =  Theodorus.Controller.extend({
    init: function (io) {
        this.view = new Theodorus.user.AccountView();
        this._super(io);
        _.bindAll(this,"openAuthenticationWindow","onAuthenticationCompleted","signout");
    },

    /*authenticate: function (href) {
        return ExternalWindow.open (href, function (accountData) {
            Theodorus.onAccountLoaded(accountData);
        });
    },*/

    openAuthenticationWindow: function (hasAccount) {
        var authenticationPopup = hasAccount ? (new Theodorus.user.SigninController(this.io)) : (new Theodorus.user.SignupController(this.io));
        authenticationPopup.callback = this.onAuthenticationCompleted;
        authenticationPopup.view.setAsPopUp(true);
        authenticationPopup.render();
    },

    onAuthenticationCompleted: function (output) {
        Theodorus.onAccountLoaded(output);
    },

    signout: function () {
        //TODO: unsaved data?
        var This = this;
        return this.io.ajax({
            url: '/me',
            type: 'DELETE',
            success: This.onAuthenticationCompleted
        });
    }
});