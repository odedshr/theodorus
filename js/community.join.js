app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  //=================================// Joining a Community
  this.registry.communityJoinPage = { preprocess: (function registerCommunityJoinPage (dElm, callback) {
    var communityId = this.state.community;
    this.api.getCommunity (communityId, onJoinCommunityDetailsLoaded.bind(this, callback));
  }).bind(this) };

  function onJoinCommunityDetailsLoaded (callback, response) {
    var data  = {
      isAuthenticated : this.isAuthenticated(),
      communityId : response.id,
      communityName : response.name,
      isMember : (response.membership && response.membership.status === 'active') ? true: false
    };
    callback(data);
  }

  this.registry.frmJoinCommunity = { attributes: { onsubmit: onJoinSubmitted.bind(this)}} ;

  function onJoinSubmitted (evt) {
    var communityId = this.state.community;
    var data = {
      name: O.ELM.memberName.value
    };
    this.api.joinCommunity(communityId, data, onJoined.bind(this, communityId));
    return false;
  }

  function onJoined (communityId, response) {
    if (response instanceof Error) {
      if (response.status === 409) {
        this.updateURL('community:'+communityId+'/');
      } else {
        this.log(response,this.logType.debug);
        alert ('failed to join community');
      }
    } else {
      this.updateURL('community:'+communityId+'/');
    }
  }

return this;}).call(app);
