/* global appName */
;(function patternsEnclosure(scope) {
  'use strict';

  function Patterns() {}

  Patterns.prototype = {
    urlParameter: new RegExp('\\[([^#]+?)\\]', 'g'),

    simpleEmail: '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$',

    email: '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@' +
    '((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))',

    maskedId: '([\\w\\d\\-]+)'
  };

  scope.pattern = new Patterns();

})(window[appName] || module.exports);
