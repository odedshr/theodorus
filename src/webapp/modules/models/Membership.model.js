/* global appName */
;(function MembershipClosure(scope) {
  'use strict';

  var definition = {
    status: ['invited', 'requested', 'declined', 'rejected', 'active', 'unfit', 'quit', 'archived'],
    name: {
      min: 4,
      max: 15
    },
    description: {
      min: 0,
      max: 140
    }
  };

  if (scope.isBackEnd) {
    module.exports = definition;
  } else {
    if (scope.models === undefined) {
      scope.models = {};
    }

    scope.onReady(function() {
      scope.models.membership = definition;
    });
  }

})(window[appName] || (function getNodeJSScope() {
  'use strict';

  return {
    isBackEnd: true,
    models: {
      community: require('./Community.model.js')
    },
    error: require('../helpers/Errors.js'),
    validate: require('../helpers/validation.js')
  };

})());
