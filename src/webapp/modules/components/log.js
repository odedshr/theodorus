/* global appName */
;(function logEnclosure(scope) {
  'use strict';

  scope.log = function Log(value) { // second parameter should be 'type'
    if (scope.isDebug) {
      console.log(value);
    }
  };

  scope.log.type = {
    debug: 'debug',
    system: 'system',
    community: 'community',
    message: 'message',
    score: 'score',
    error: 'error'
  };

})(window[appName] || module.exports);
