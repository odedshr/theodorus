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
        if (communityId !== undefined && communityId.length > 0) {
            this.api.async([
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
        var dataForDisplay  = {
            communityId : data.getCommunity.id,
            communityName : data.getCommunity.name,
            isMember : ((data.getCommunity.membership !== undefined) && (data.getCommunity.membership.status === 'active')),
            topics : data.getCommunityTopics
        };
        if (dataForDisplay.isMember) {
            dataForDisplay.memberName = data.getCommunity.membership.name ? data.getCommunity.membership.name : '';
        }
        this.render(O.ELM.pageContainer,{communityPage: dataForDisplay});
        callback();
    }

    //=================================//

    this.registry.frmAddCommunity = (function registerBtnAdd (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-add-community',onAddSubmitted.bind(this)).getDispatcher('submit-add-community');
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

return this;}).call(app);