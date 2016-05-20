(function CommunityPageEnclosure() {
  'use strict';

  this.registry = this.registry || {};

  this.registry.communityPage = { preprocess: (function registerCommunityPage(dElm, callback) {
    var communityId = this.state.community;
    if (communityId !== undefined && communityId.length > 0) {
      this.api.async({
          getCommunity : this.api.getCommunity.bind(this, communityId)
        },
        DataLoaded.bind(this, callback));
    } else {
      this.updateURL('communities', '');
    }
  }).bind(this) } ;

  function DataLoaded(callback, data) {
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
      emptyTopic: {
        id: '',
        content: '',
        images: { image: [] },
        contentLength : this.getPostLengthString('', community.topicLength)
      }
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
    onclick: RequestQuitCommunity.bind(this)
  } };

  function RequestQuitCommunity (evt) {
    this.confirm (O.TPL.translate('confirm.leaveCommunity'),LeaveCommunityConfirmed.bind(this));
    return false;
  }

  function LeaveCommunityConfirmed (isConfirmed) {
    if (isConfirmed) {
      this.api.quitCommunity(this.state.community, LeftCommunity.bind(this));
    }
  }

  function LeftCommunity () {
    delete this.state.community;
    delete this.state.communityJSON;
    this.updateURL('community/', O.TPL.translate('pageTitle.community'));
  }

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
