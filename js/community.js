app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.frmAddCommunity = (function registerCreateCommunityForm (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-add-community',onAddSubmitted.bind(this)).getDispatcher('submit-add-community');
        this.api.getMyCommunities (setDefaultFounderName.bind(this));
        callback();
    }).bind(this);

    function setDefaultFounderName (communities) {
        var maxName = '', maxCount = 0;
        var count = {};
        var i = communities.length;
        while (i--) {
            var name = communities[i].membershipName;
            var nameCount = count[name];
            nameCount = (count[name] === undefined) ? 1 : nameCount + 1;
            count[name] = nameCount;
            if (nameCount >= maxCount) {
                maxName = name;
                maxCount = nameCount;
            }
        }
        O.ELM.founderName.value = maxName;
    }
    //=================================//
    this.registry.communityPage = (function registerCommunityPage (dElm, callback) {
        var communityId = this.state.community;
        this.api.getCommunity (communityId, onCommunityDetailsLoaded.bind(this, callback));
    }).bind(this);

    function onCommunityDetailsLoaded (callback, response) {
        var data  = {
            communityId : response.id,
            communityName : response.name,
            isMember : false
        };
        console.log(response);
        if (response.membership) {
            data.isMember = response.membership.status === 'active';
            data.memberName = response.membership.name ? response.membership.name : '';
        }
        this.render(O.ELM.pageContainer,{communityPage: data});
        callback();
    }

    //================================//

    this.registry.communityJoinPage = (function registerCommunityJoinPage (dElm, callback) {
        var communityId = this.map.community;
        this.api.getCommunity (communityId, onJoinCommunityDetailsLoaded.bind(this, callback));
    }).bind(this);

    function onJoinCommunityDetailsLoaded (callback, response) {
        var data  = {
            communityId : response.id,
            communityName : response.name,
            isMember : (response.membership && response.membership.status === 'active') ? true: false
        };
        this.render(O.ELM.pageContainer,{communityJoinPage: data});
        callback();
    }

    this.registry.frmJoinCommunity = (function registerBtnJoin (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-join-community',onJoinSubmitted.bind(this)).getDispatcher('submit-join-community');
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
            this.updateURL('community:'+communityId+'/', O.TPL.translate('pageTitle.community'));
        }
    }
    //=================================//

    this.registry.frmAddCommunity = (function registerBtnAdd (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-add-community',onJoinSubmitted.bind(this)).getDispatcher('submit-add-community');
        callback();
    }).bind(this);

    function onAddSubmitted (evt) {
        var data = {
            name: O.ELM.communityName.value
        };
        if (data.name.length === 0) {
            alert ('name cannot be empty');
        } else {
            var founderName = O.ELM.founderName.value;
            if (founderName.length > 0) {
                data.founderName = founderName;
            }
            this.api.addCommunity(data, onCommunityAdded.bind(this));
        }

        return false;
    }

    function onCommunityAdded (response) {
        if (response instanceof Error) {
            alert ('failed to add community');
            console.log(response);
        } else {
            location.href = '#community:'+response.id;
        }
    }

    function onFounderMembershipAdded (response) {
        if (response instanceof Error) {
            alert ('failed to add membership');
            console.log(response);
        } else {
            console.log('founder added:');
            console.log(response);
        }
    }
    //=================================//

    this.registry.btnLeave = (function registerBtnAdd (dElm, callback) {
        dElm.onclick = O.EVT.subscribe('submit-quit-community', this.onLeaveClicked.bind(this)).getDispatcher('submit-quit-community');
        callback();
    }).bind(this);

    this.onLeaveClicked = (function onLeaveClicked () {
        var communityId = this.state.community;
        this.api.quitCommunity(communityId,onLeaveClicked.bind(this,communityId));
    }).bind(this);

    this.onLeftCommunity = (function onLeftCommunity (communityId) {
        this.updateURL('community:'+communityId+'/', O.TPL.translate('pageTitle.community'));
    }).bind(this);

    //=================================//
    this.registry.myCommunityList = (function registerMyCommunityList (dElm, callback) {
        this.api.getMyCommunities(gotMyCommunityList.bind(this,dElm));
        callback();
    }).bind(this);

    function gotMyCommunityList (dElm, response) {
        this.render(dElm, {communityList: {communities:{community: response}}});
    }

return this;}).call(app);