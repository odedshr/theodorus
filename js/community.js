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
    this.registry.loadCommunityPageTemplate = (function registerCommunityPage (dElm, callback) {
        var communityId = this.mapArgumentsFromLocationHash().community;
        this.api.getCommunity (communityId, onCommunityDetailsLoaded.bind(this, callback));
    }).bind(this);

    function onCommunityDetailsLoaded (callback, response) {
        var data  = {
            communityId : response.id,
            communityName : response.name,
            isMember : (response.membership && response.membership.status === 'active') ? true: false
        };
        this.render(O.ELM.pageContainer,{loadCommunityPageTemplate: data});
        callback();
    }

    this.registry.btnJoin = (function registerBtnJoin (dElm, callback) {
        dElm.onclick = O.EVT.subscribe('submit-join-community',onJoinSubmitted.bind(this)).getDispatcher('submit-join-community');
        callback();
    }).bind(this);
    //=================================//
    function onJoinSubmitted () {
        var communityId = this.mapArgumentsFromLocationHash().community;
        O.AJAX.post(this.backend + 'community/'+communityId+'/members/', {}, onJoined.bind(this));
        return false;
    }

    function onJoined (response) {
        if (response instanceof Error) {
            alert ('failed to join community');
        } else {
            this.renderPage();
        }
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
            O.AJAX.post(this.backend + 'community', data, onCommunityAdded.bind(this));
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
    this.registry.myCommunityList = (function registerMyCommunityList (dElm, callback) {
        O.AJAX.get(this.backend + 'community', gotMyCommunityList.bind(this,dElm));
        callback();
    }).bind(this);

    function gotMyCommunityList (dElm, response) {
        this.render(dElm, {communityListTemplate: {communities:{community: response}}});
    }

return this;}).call(app);