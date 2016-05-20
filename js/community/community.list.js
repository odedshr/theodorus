app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  var filters = {};

  this.registry.communitiesPage = { preprocess: (function registerCommunityPage (dElm, callback) {
    document.title = O.TPL.translate('title.communities');
    callback ({isAuthenticated : this.isAuthenticated()});
  }).bind(this)} ;

  //=================================//
  this.registry.communityList = { preprocess: registerMyCommunityList.bind(this) };
  function registerMyCommunityList (dElm, callback) {
    var cached = this.registry.communityList.cached;

    if (cached) {
      callback ({ communities:{community: this.getFilteredItems.call (this, cached, filters) } });
    } else {
      this.api.getCommunityList(communityListOnDataLoaded.bind (this, callback));
    }
  }

  function communityListOnDataLoaded (callback, response) {
    var community, communities = response.communities;
    for (var i = 0, length = communities.length; i < length; i++) {
      community = communities[i];
      community.mdDescription = community.description ? this.htmlize(community.description) : '';
    }
    this.state.communities = communities;
    callback ({ communities:{community: this.getFilteredItems.call (this,communities, filters) } });
  }

  //==========================

  this.registry.filterCommunities = { attributes: { onkeyup : filterCommunities.bind(this)} };
  function filterCommunities (evt) {
    filters.name = evt.target.value;
    this.registry.communityList.cached = this.state.communities;
    this.register(document.querySelector('[data-register="communityList"]'));
    delete this.registry.communityList.cached;
  }

  this.registry.topCommunities = { preprocess: getTopCommunities.bind(this),
                                   template: 'communityList' };
  function getTopCommunities (dElm, callback) {
    var cached = this.registry.topCommunities.cached;
    if (cached) {
      callback ({ communities:{community: this.getFilteredItems.call (this, cached, filters) } });
    } else {
      this.api.getTopCommunities(1, 10, communityListOnDataLoaded.bind (this, callback));
    }
  }

return this;}).call(app);
