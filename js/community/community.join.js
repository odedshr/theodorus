app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
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
        onJoinCommunityDetailsLoaded.bind(this,callback));
    } else {
      this.updateURL('communities','');
    }
  }).bind(this) };

  function onJoinCommunityDetailsLoaded (callback, data) {
    var community = data.getCommunity.community;
    var membership = data.getCommunity.membership;

    if ((!!membership && membership.status === 'active')) {
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

  this.registry.frmJoinCommunity = { attributes: { onsubmit: onJoinSubmitted.bind(this)}} ;

  function onJoinSubmitted (evt) {
    var profileImage = O.ELM.profileImagePreview;
    var data = {
        membership: this.getFormFields (evt.target),
        membershipImage : (profileImage.getAttribute('data-dirty') === 'true') ? profileImage.src : undefined
    };
    //TODO: validate input
    var communityId = this.state.community;
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
