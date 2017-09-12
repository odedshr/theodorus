/* global appName */
;(function communityPageEnclosure(scope) {
  'use strict';

  function UserPage() {
    this.constructor.apply(this, arguments);

    return this.init;
  }

  UserPage.prototype = {
    constructor: function constructor() {
      this.init = this.init.bind(this);
      this.init.url = '/user/connect:[token]/redirect:[url]';
      this.init.parameters = {
        token: 'string',
        url: 'string',
      };
    },

    init: function init() {
      var url = decodeURIComponent(this.init.data.url);

      scope.io.user.connect(this.init.data.token,
                             this._gotAuthToken.bind({}, url));
    },

    _gotAuthToken: function _gotAuthToken(url, response) {
      if (scope.error.isError(response)) {
        scope.page.render('connectionError', {
          isExpired: response.response.message === 'expired',
          isBadInput: response.response.message === 'bad-input'
        });
      } else {
        location.href = url;
      }
    }
  };

  scope.onReady(function() {
    scope.page(UserPage);
  });
})(window[appName] || module.exports);
