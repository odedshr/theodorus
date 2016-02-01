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
        this.api.clearCache();
        location.href = '/';
        return false;
    }

return this;}).call(app);