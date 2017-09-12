/* global appName */
;(function cookieSystemEnclosure(scope) {
  'use strict';

  function Cookie() {
    return this.cookie.bind(this);
  }

  Cookie.prototype = {
    set: function setCookie(key, value, expireDays) {
      var d = new Date(),
          expires;

      if (expireDays === undefined) {
        expireDays = 0;
      }

      d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
      expires = 'expires=' + d.toUTCString();
      document.cookie = key + '=' + value + '; ' + expires + '; path=/';
    },

    get: function getCookie(key) {
      if (key === undefined) {
        return document.cookie;
      }

      return document.cookie.replace(new RegExp('(?:(?:^|.*;\\s*)' + key + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1');
    },

    cookie: function cookie(key, value, expireDays) {
      if (value !== undefined) {
        this.set(key, value, expireDays);

      } else {
        return this.get(key);
      }
    }
  };

  scope.cookie = new Cookie();

})(window[appName] || module.exports);
