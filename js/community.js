app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';

    this.registry = this.registry || {};
    this.components = this.components || {};

    //=================================//
    this.registry.communityList = { preprocess: (function registerMyCommunityList (dElm, callback) {
        //if (this.isAuthenticated()) {
        //    this.api.getMyCommunities(renderCommunityList.bind(this,dElm));
        //} else {
        this.api.getCommunityList(communityListOnDataLoaded.bind(this, callback));
        //}
    }).bind(this) };

    function communityListOnDataLoaded (callback, response) {
        callback ({ communities:{community: response}});
    }

    //=================================// Leaving a Community
    this.registry.btnLeave = { attributes: { onclick: onRequestQuitCommunity.bind(this) } };

    function onRequestQuitCommunity (evt) {
        this.confirm (O.TPL.translate('confirm.leaveCommunity'),onLeaveCommunityConfirmed.bind(this));
        evt.detail.preventDefault();
    }

    function onLeaveCommunityConfirmed (isConfirmed) {
        if (isConfirmed) {
            this.api.quitCommunity(this.state.community, onLeftCommunity.bind(this));
        }
    }

    function onLeftCommunity () {
        this.updateURL('community/', O.TPL.translate('pageTitle.community'));
    }
return this;}).call(app);