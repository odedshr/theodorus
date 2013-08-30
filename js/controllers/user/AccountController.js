Theodorus.namespace("user").AccountController =  Class.extend({
    init: function (parent) {
        this.parent = parent;
        this.view = new Theodorus.user.AccountView();
        this.view.setController(this);
        _.bindAll(this,"openAuthenticationWindow","onAuthenticationCompleted","signout");
    },

    /*authenticate: function (href) {
        return ExternalWindow.open (href, function (accountData) {
            Theodorus.onAccountLoaded(accountData);
        });
    },*/

    openAuthenticationWindow: function (hasAccount) {
        var authenticationPopup = hasAccount ? (new Theodorus.user.SigninController(this)) : (new Theodorus.user.SignupController(this));
        authenticationPopup.callback = this.onAuthenticationCompleted;
        authenticationPopup.view.setAsPopUp(true);
        authenticationPopup.view.render();
    },

    onAuthenticationCompleted: function (output) {
        Theodorus.onAccountLoaded(output);
    },

    signout: function () {
        //TODO: unsaved data?
        var This = this;
        return $.ajax({
            url: '/me',
            type: 'DELETE',
            success: This.onAuthenticationCompleted
        });
    }
});