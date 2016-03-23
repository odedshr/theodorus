app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';

    this.registry = this.registry || {};

    this.registry.frmAddCommunity = {
        attributes: { onsubmit:  onAddSubmitted.bind(this) } ,
        preprocess : registerCreateCommunityForm.bind(this)
    };

    function registerCreateCommunityForm (dElm, callback) {
        this.api.getMyCommunities (getMostCommonMembershipName.bind(this, gotMostCommonMembershipName.bind(this, callback)));
    }

    function getMostCommonMembershipName (callback, name) {
        callback({founderName : name});
    }
    function gotMostCommonMembershipName (callback, communities) {
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
       callback(maxName);
    }

    function onAddSubmitted (evt) {
        var data = this.getFormFields(evt.target);
        this.api.addCommunity(data, onCommunityAdded.bind(this));
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

return this;}).call(app);