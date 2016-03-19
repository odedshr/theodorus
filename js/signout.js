app = (typeof app != "undefined") ? app:{};
(function signoutEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.btnSignOut = { attributes: { onclick : onSignOutClicked.bind(this)} };

    function onSignOutClicked (evt) {
        O.COOKIE('authToken','');
        this.state.email = '';
        this.api.clearCache();
        this.goToStateRedirect();
        evt.detail.preventDefault();
    }

return this;}).call(app);