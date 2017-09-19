/* global appName */
;(function MembershipClosure(expose/*, scope*/) {
  'use strict';

  function Membership() {}

  Membership.spec = {
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

  expose(Membership);

})(function expose(module) {
  'use strict';

  if (module.exports) {
    // back-end
    module.exports = module;
  } else if (window[appName].onReady) {
    // loading after initial load
    window[appName].onReady(function addModuleWhenReady() { window[appName][module.name] = module; });
  } else {
    // load straight away
    window[appName][module.name] = module;
  }
}, window ? window[appName] : {
  error: require('../helpers/Errors.js'),
  validate: require('../helpers/validation.js')
});
