app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  this.registry.communityPage = { preprocess: (function registerCommunityPage(dElm, callback) {
    var communityId = this.state.community;
    if (communityId !== undefined && communityId.length > 0) {
      this.api.async({
          getCommunity : this.api.getCommunity.bind(this, communityId)
        },
        onDataLoaded.bind(this, callback));
    } else {
      this.updateURL('communities', '');
    }
  }).bind(this) } ;

  function onDataLoaded(callback, data) {
    var community = data.getCommunity.community;
    var membership = data.getCommunity.membership;
    document.title = community.name;
    this.state.communityJSON = community;
    community.membership = membership;

    var isMember = (!!membership && (membership.status === 'active'));

    var dataForDisplay  = {
      communityId: community.id,
      communityName: community.name,
      isMember: isMember,
      topics: { topic: [] },
      id: '',
      content: '',
      contentLength : this.getPostLengthString('', community.topicLength)
    };
    if (dataForDisplay.isMember) {
      dataForDisplay.memberName = community.membership.name ?
        data.getCommunity.membership.name : '';
    } else {
      dataForDisplay.joinLink = this.isAuthenticated() ?
      '#community:{{communityId}}/join' : '#join';
    }

    dataForDisplay.email = this.state.user ? this.state.user.email : '';
    callback(dataForDisplay);
  }

  //=================================// Leaving a Community
  this.registry.btnLeave = { attributes: {
    onclick: onRequestQuitCommunity.bind(this)
  } };

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
    delete this.state.community;
    delete this.state.communityJSON;
    this.updateURL('community/', O.TPL.translate('pageTitle.community'));
  }

return this;}).call(app);
