app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';

    this.registry = this.registry || {};

    this.registry.communityPage = { preprocess: (function registerCommunityPage (dElm, callback) {
        var communityId = this.state.community;
        if (communityId !== undefined && communityId.length > 0) {
            this.api.async([
                    this.api.getCommunity.bind(this,communityId),
                    this.api.getCommunityTopics.bind(this,communityId)
                ],
                onDataLoaded.bind(this,callback));
        } else {
            this.updateURL('communities','');
        }
    }).bind(this)} ;

    function onDataLoaded (callback, data) {
        document.title = data.getCommunity.name;
        this.state.communityJSON = data.getCommunity;
        this.state.communityTopics = data.getCommunityTopics;
        var dataForDisplay  = {
            communityId : data.getCommunity.id,
            communityName : data.getCommunity.name,
            isMember : ((data.getCommunity.membership !== undefined) && (data.getCommunity.membership.status === 'active')),
            topics : data.getCommunityTopics
        };
        if (dataForDisplay.isMember) {
            dataForDisplay.memberName = data.getCommunity.membership.name ? data.getCommunity.membership.name : '';
        }
        dataForDisplay.email = this.state.email;

        callback(dataForDisplay);
    }

    //=================================// Leaving a Community
    this.registry.btnLeave = { attributes: { onclick: onRequestQuitCommunity.bind(this) } };

    function onRequestQuitCommunity (evt) {
        this.confirm (O.TPL.translate('confirm.leaveCommunity'),onLeaveCommunityConfirmed.bind(this));
        return false;
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