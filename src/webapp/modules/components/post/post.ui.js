/* global appName */
// cSpell:words unfollow, unendorse, unreport
;(function postListItemViewEnclosure(scope) {
  'use strict';

  function post() {}

  post.prototype = {
    init: function init(dElm) {
      this._assign(dElm, '.action-comment', this.toggleSection);
      this._assign(dElm, '.action-follow', this._setAttribute.bind(this, 'follow', 'unfollow'));
      this._assign(dElm, '.action-endorse', this._setAttribute.bind(this, 'endorse', 'unendorse'));
      this._assign(dElm, '.action-report', this._setAttribute.bind(this, 'report', 'unreport'));
      this._assign(dElm, '.action-read', this._setAttribute.bind(this, 'read', 'unread'));
      this._assign(dElm, '.action-archive', this.archive);
      try {
        this._assign(dElm, '.action-history', this.toggleSection);
      }
      catch (err) { /* not all posts have history */ }
    },

    _assign: function _assign(dElm, query, method) {
      var dButton = dElm.querySelector(query);

      if (dButton !== null) {
        dButton.onclick = method.bind(this, dElm, dButton);
      } else {
        throw scope.error.notFound('dElement', query);
      }
    },

    _toggle: function _toggle(dButton) {
      var state = dButton.getAttribute('aria-checked') !== 'true';

      dButton.setAttribute('aria-checked', state);

      return state;
    },

    toggleSection: function toggleSection(dElm, dButton) {
      var isExpanded = this._toggle(dButton),
          expandable = document.getElementById(dButton.getAttribute('aria-controls'));

      expandable.setAttribute('aria-expanded', isExpanded);

      if (isExpanded && expandable.getAttribute('aria-live') !== null) {
        expandable.setAttribute('data-template', 'postList');
        scope.ui.invoke(expandable);
      }
    },

    archive: function archive(dElm) {
      if (window.confirm(scope.template.translate('confirm.removePost'))) {
        scope.io.post.archive(dElm.getAttribute('data-id'), function postArchived() {
          dElm.parentNode.removeChild(dElm);
        });
      }
    },

    _setAttribute: function _setAttribute(action, undo, dElm, dButton) {
      var attribute = this._toggle(dButton) ? action : undo;

      scope.io.post.setAttribute(dElm.getAttribute('data-id'), attribute, this._attributeUpdated.bind(this, dElm));
    },

    _attributeUpdated: function _followUpdated(dElm, response) {
      if (scope.error.isError(response)) {
        console.log('error', response);
      } else {
        dElm.querySelector('.statistics')
            .innerHTML = scope.template.render({ postStatistics: this.getPostStatistics(response.subject) });
      }
    },

    getPostStatistics: function getPostStatistics(post) {
      return {
        replies: post.replies || 0,
        follow: post.follow || 0,
        endorse: post.endorse || 0,
        report: post.report || 0,
        read: post.read || 0
      };

    }
  };

  scope.onReady(function() {
    scope.ui.add(post);
  });
})(window[appName]);
