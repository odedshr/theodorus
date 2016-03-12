app = (typeof app != "undefined") ? app:{};
(function signoutEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.btnSignOut = (function registerSignInForm (dElm, callback) {
        dElm.onclick = O.EVT.subscribe('sign-out',onSignOutClicked.bind(this)).getDispatcher('sign-out');
        callback();
    }).bind(this);

    function onSignOutClicked (evt) {
        O.COOKIE('authToken','');
        this.state.email = '';
        this.api.clearCache();
        this.goToStateRedirect();
        evt.detail.preventDefault();
    }

return this;}).call(app);