;(function logEnclosure(scope) {
  'use strict';

  scope.log = function Log(value, type) {
    if (scope.debug) {
      console.log(value);
    }
  };

  scope.log.type = {
    'debug': 'debug',
    'system': 'system',
    'community': 'community',
    'message': 'message',
    'score': 'score',
    'error': 'error'
  };

})(theodorus);
