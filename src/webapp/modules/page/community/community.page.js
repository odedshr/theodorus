/* global appName */
;(function communityPageEnclosure(scope) {
  'use strict';

  function CommunityPage() {
    this.constructor.apply(this, arguments);

    return this.init;
  }

  CommunityPage.prototype = {
    constructor: function constructor() {
      this.init = this.init.bind(this);
      this.init.url = '/community/[communityId]';
      this.init.parameters = {
        communityId: 'id'
      };
    },

    init: function init() {
      var communityId = this.init.data.communityId;

      if (communityId === undefined) {
        scope.page.goTo('/');
      } else {
        scope.page.render('loading');
        scope.api.community.get(communityId, this._onCommunityLoaded);
      }
    },

    _onCommunityLoaded: function onCommunityLoaded(data) {
      var community = data.community;

      community.founder = data.founder;
      community.membership = data.membership;

      scope.state.community = community;

      if (community === undefined) {
        scope.page.to('notFound');

        return;
      }

      scope.page.render('community', {
        id: community.id,
        name: community.name,
        isConnected: scope.io.user.isConnected(),
        isMember: data.membership !== null,
        isNotMemberButCanJoin: (data.membership === null), //&& scope.membership.isValid(scope.state.user, community)
        contentLengthString: scope.ui.textField.getLengthString('', community.postLength)
      });
    }
  };

  scope.onReady(function() {
    scope.page(CommunityPage);
  });
})(window[appName] || module.exports);
