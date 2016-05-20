(function CommunityListEnclosure() {
  'use strict';

  this.registry = this.registry || {};

  var filters = {};

  this.registry.communitiesPage = { preprocess: (function registerCommunityPage (dElm, callback) {
    document.title = O.TPL.translate('title.communities');
    callback ({isAuthenticated : this.isAuthenticated()});
  }).bind(this)} ;

  //=================================//
  this.registry.communityList = { preprocess: RegisterMyCommunityList.bind(this) };
  function RegisterMyCommunityList (dElm, callback) {
    var cached = this.registry.communityList.cached;

    if (cached) {
      callback ({ communities:{community: this.getFilteredItems.call (this, cached, filters) } });
    } else {
      this.api.getCommunityList(CommunityListOnDataLoaded.bind (this, callback));
    }
  }

  function CommunityListOnDataLoaded (callback, response) {
    var community, communities = response.communities;
    for (var i = 0, length = communities.length; i < length; i++) {
      community = communities[i];
      community.mdDescription = community.description ? this.htmlize(community.description) : '';
    }
    this.state.communities = communities;
    callback ({ communities:{community: this.getFilteredItems.call (this,communities, filters) } });
  }

  //==========================

  this.registry.filterCommunities = { attributes: { onkeyup : FilterCommunities.bind(this)} };
  function FilterCommunities (evt) {
    filters.name = evt.target.value;
    this.registry.communityList.cached = this.state.communities;
    this.register(document.querySelector('[data-register="communityList"]'));
    delete this.registry.communityList.cached;
  }

  this.registry.topCommunities = { preprocess: GetTopCommunities.bind(this),
                                   template: 'communityList' };
  function GetTopCommunities (dElm, callback) {
    var cached = this.registry.topCommunities.cached;
    if (cached) {
      callback ({ communities:{community: this.getFilteredItems.call (this, cached, filters) } });
    } else {
      this.api.getTopCommunities(1, 10, CommunityListOnDataLoaded.bind (this, callback));
    }
  }

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
