/* global appName */
;(function communityListUiEnclosure(scope) {
  'use strict';

  function communityList() {}

  communityList.prototype = {
    init: function render(dElm) {
      scope.io.community.list(this.process.bind(this, this.draw.bind(this, dElm)));
    },

    process: function processCommunityList(callback, data) {
      var communities = data.communities,
      memberships = data.memberships || {};

      if (data instanceof Error) {
        scope.log('failed to load community list', scope.log.type.error);
        scope.log(data, scope.log.type.debug);

        return callback({ items: [] });
      }

      //scope.images.addToEntityArray(communities);

      communities.forEach(function perCommunity(community) {
        var membership = memberships[community.id];

        community.mdName = community.name ? scope.strings.mdToHtml(community.name) : '';
        community.isMember = !!membership;

        //community.mdDescription = community.description ? scope.strings.mdToHtml(community.description) : '';
        //community.time = moment(community.modified).format('MMM Do YY, h:mma');
        //community.relativeTime = moment(community.modified).fromNow();

        if (membership) {
          community.memberSince = moment(membership.created).format('MMM Do YY, h:mma');
          community.memberSinceRelative = moment(membership.created).fromNow();
        } else {
          community.memberSince = false;
        }
      });

      return callback(data);
    },

    draw: function drawCommunityList(dElm, data) {
      data.isConnected = scope.io.user.isConnected();
      data.addCommunityForm = scope.io.community.getCommunitySpec();

      dElm.innerHTML = scope.template.render({ communityList: data });
      scope.ui.preventInternalLinksFromReloadingPage(dElm);
      scope.ui.invokeChildren(dElm);
    }
  };

  scope.onReady(function() {
    scope.ui.add(communityList);
  });
})(window[appName]);
