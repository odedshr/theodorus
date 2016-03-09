app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    O.EVT.subscribe('submit-add-community',onAddSubmitted.bind(this))
         .subscribe('request-quit-community',onRequestQuitCommunity.bind(this));

    this.registry.frmAddCommunity = (function registerCreateCommunityForm (dElm, callback) {
        dElm.onsubmit = O.EVT.getDispatcher('submit-add-community');
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
        if (communityId !== undefined && communityId.length > 0) {
            this.api.async([
                this.api.getEmail.bind(this),
                this.api.getCommunity.bind(this,communityId),
                this.api.getCommunityTopics.bind(this,communityId)
            ],
            onDataLoaded.bind(this,callback));
        } else {
            this.updateURL('communities','');
        }
    }).bind(this);

    function onDataLoaded (callback, data) {
        this.state.communityJSON = data.getCommunity;
        this.state.communityTopics = data.getCommunityTopics;
        this.state.email = data.getEmail.email;
        var dataForDisplay  = {
            communityId : data.getCommunity.id,
            communityName : data.getCommunity.name,
            isMember : ((data.getCommunity.membership !== undefined) && (data.getCommunity.membership.status === 'active')),
            topics : data.getCommunityTopics
        };
        if (dataForDisplay.isMember) {
            dataForDisplay.memberName = data.getCommunity.membership.name ? data.getCommunity.membership.name : '';
        }
        dataForDisplay.username = data.getEmail.email;
        console.log(this.state);
        console.log(dataForDisplay);
        this.render(O.ELM.pageContainer,{communityPage: dataForDisplay});
        callback();
    }

    //=================================//

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

        evt.detail.preventDefault();
    }

    function onCommunityAdded (response) {
        if (response instanceof Error || !response) {
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
    this.registry.myCommunityList = (function registerMyCommunityList (dElm, callback) {
        //if (this.isAuthenticated()) {
        //    this.api.getMyCommunities(renderCommunityList.bind(this,dElm));
        //} else {
            this.api.getCommunityList(renderCommunityList.bind(this,dElm));
        //}
        callback();
    }).bind(this);

    function renderCommunityList (dElm, response) {
        this.render(dElm, {communityList: {communities:{community: response}}});
    }

    //=================================// Joining a Community
    this.registry.communityJoinPage = (function registerCommunityJoinPage (dElm, callback) {
        var communityId = this.state.community;
        this.api.getCommunity (communityId, onJoinCommunityDetailsLoaded.bind(this, callback));
    }).bind(this);

    function onJoinCommunityDetailsLoaded (callback, response) {
        var data  = {
            isAuthenticated : this.isAuthenticated(),
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

    function onJoinSubmitted (evt) {
        var communityId = this.state.community;
        var data = {
            name: O.ELM.memberName.value
        };
        this.api.joinCommunity(communityId, data, onJoined.bind(this, communityId));
        evt.detail.preventDefault();
    }

    function onJoined (communityId, response) {
        if (response instanceof Error) {
            if (response.status === 409) {
                this.updateURL('community:'+communityId+'/', O.TPL.translate('pageTitle.community'));
            } else {
                this.log(response,this.logType.debug);
                alert ('failed to join community');
            }
        } else {
            this.updateURL('community:'+communityId+'/', O.TPL.translate('pageTitle.community'));
        }
    }

    //=================================// Leaving a Community
    this.registry.btnLeave = (function registerQuitCommunityButton (dElm, callback) {
        dElm.onclick = O.EVT.getDispatcher('request-quit-community');
        callback();
    }).bind(this);

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