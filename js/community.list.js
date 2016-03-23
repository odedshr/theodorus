app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';

    this.registry = this.registry || {};

    this.registry.communitiesPage = { preprocess: (function registerCommunityPage (dElm, callback) {
        callback ({isAuthenticated : this.isAuthenticated()});
    }).bind(this)} ;

    //=================================//
    this.registry.communityList = { preprocess: (function registerMyCommunityList (dElm, callback) {
        document.title = O.TPL.translate('title.communities');
        //if (this.isAuthenticated()) {
        //    this.api.getMyCommunities(renderCommunityList.bind(this,dElm));
        //} else {
        this.api.getCommunityList(communityListOnDataLoaded.bind(this, callback));
        //}
    }).bind(this) };

    function communityListOnDataLoaded (callback, response) {
        callback ({ communities:{community: response} });
    }

return this;}).call(app);