app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.communityJoinPage = (function registerCommunityJoinPage (dElm, callback) {
        var communityId = this.state.community;
        if (communityId !== undefined && communityId.length > 0) {
            this.api.getCommunity (communityId, onJoinCommunityDetailsLoaded.bind(this, callback));
        } else {
            this.render(O.ELM.pageContainer,{ errorPage: { errorMessage: O.TPL.translate('error.cannotJoinCommunityWithoutId') }});
        }

    }).bind(this);

    function onJoinCommunityDetailsLoaded (callback, response) {
        var data  = {
            communityId : response.id,
            communityName : response.name,
            isMember : (response.membership && response.membership.status === 'active') ? true: false,
            isAuthenticated : this.isAuthenticated()
        };
        if (data.isMember) {
            this.log('already member in this community, moving to community page', this.logType.debug);
            this.updateURL('community:'+data.communityId+'/', O.TPL.translate('pageTitle.community'));
        } else {
            this.render(O.ELM.pageContainer,{communityJoinPage: data});
        }

        callback();
    }

    this.registry.frmJoinCommunity = (function registerBtnJoin (dElm, callback) {
        dElm.onsubmit = this.simplyReturn.bind(this,false);
        callback();
    }).bind(this);

    this.registry.btnJoinSubmit = (function registerJoinCommunityButton (dElm, callback) {
        dElm.onclick = O.EVT.subscribe('submit-join-community',onJoinSubmitted.bind(this)).getDispatcher('submit-join-community');
        callback();
    }).bind(this);

    function onJoinSubmitted () {
        var communityId = this.state.community;
        var data = {
            name: O.ELM.memberName.value
        };
        this.api.joinCommunity(communityId, data, onJoined.bind(this, communityId));
        return false;
    }

    function onJoined (communityId, response) {
        if (response instanceof Error) {
            alert ('failed to join community');
        } else {
            var topic = {
                communityId: this.state.community,
                content: O.TPL.translate('post.xJoinedCommunity').replace('{name}',response.name),
                status: 'active'
            };
            this.api.clearCache();
            this.api.addTopic(topic, this.updateURL.bind(this, 'community:'+communityId+'/', O.TPL.translate('pageTitle.community')));

        }
    }

    //=================================//

    this.registry.btnLeave = (function registerBtnAdd (dElm, callback) {
        dElm.onclick = O.EVT.subscribe('submit-quit-community', this.onLeaveClicked.bind(this)).getDispatcher('submit-quit-community');
        callback();
    }).bind(this);

    this.onLeaveClicked = (function onLeaveClicked () {
        var communityId = this.state.community;
        this.api.clearCache();
        this.api.quitCommunity(communityId, this.updateURL.bind(this,'community:'+communityId+'/', O.TPL.translate('pageTitle.community')));
    }).bind(this);

return this;}).call(app);