(function CommunityJoinEnclosure() {
  'use strict';

  this.registry = this.registry || {};

  //=================================// Joining a Community
  this.registry.communityJoinPage = { preprocess: (function registerCommunityJoinPage (dElm, callback) {
    document.title = O.TPL.translate('title.communityJoin');
    var communityId = this.state.community;
    if (communityId !== undefined && communityId.length > 0) {
      this.api.async({
          'getCommunity': this.api.getCommunity.bind(this,communityId),
          'getAllUserImages': this.api.getAllUserImages.bind(this)
        },
        JoinCommunityDetailsLoaded.bind(this,callback));
    } else {
      this.updateURL('communities','');
    }
  }).bind(this) };

  function UserCommunityMatcher (user, community) {
    var age = moment().diff(user.birthDate, 'years');
    if (community.minAge !== -1 && age < community.minAge) {
      return false;
    }
    if (community.maxAge !== -1 && age < community.maxAge) {
      return false;
    }
    if (community.gender !== 'undefined' && user.gender !== community.gender) {
      return false;
    }
    return true;
  }
  this.isUserFitForCommunity = UserCommunityMatcher.bind(this);

  function JoinCommunityDetailsLoaded (callback, data) {
    var community = data.getCommunity.community;
    var membership = data.getCommunity.membership;

    if ((!!membership && membership.status === 'active') ||
          !this.isUserFitForCommunity(this.state.user, community)) {
        this.updateURL('community:'+community.id+'/');
    } else {
      // set default values:
      membership = { name: '', hasImage: false, id: undefined };
    }
    var dataForDisplay  = {
      isAuthenticated : this.isAuthenticated(),
      communityId : community.id,
      communityName : community.name,
      memberName : membership.name,
      hasImage: membership.hasImage,
      profileImage: '',
      images : this.getImageList (data.getAllUserImages.images, membership.id )
    };
    callback(dataForDisplay);
  }

  this.registry.frmJoinCommunity = { attributes: { onsubmit: JoinSubmitted.bind(this)}} ;
  function JoinSubmitted (evt) {
    var profileImage = O.ELM.profileImagePreview;
    var data = {
        membership: this.getFormFields (evt.target),
        membershipImage : (profileImage.getAttribute('data-dirty') === 'true') ? profileImage.src : undefined
    };
    //TODO: validate input
    var communityId = this.state.community;
    this.api.joinCommunity(communityId, data, Joined.bind(this, communityId));
    return false;
  }

  function Joined (communityId, response) {
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

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
