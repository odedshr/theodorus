/* global appName */
// cSpell:words backend
(function CommunityModelClosure(expose/*, scope*/) {
  'use strict';

  function Community() {}

  Community.spec = {
    status: ['active', 'suspended', 'archived'],
    gender: ['undefined', 'female', 'male'],
    type: ['public', 'exclusive', 'secret'],
    name: {
      min: 5,
      max: 32
    },
    description: {
      min: 0,
      max: 140
    }
  };

  expose(Community);

})(function expose(method) {
  'use strict';

  if (typeof window !== 'undefined') {
    if (window[appName].onReady) {
      // loading after initial load
      window[appName].onReady(function addModuleWhenReady() { window[appName][method.name] = method; });
    } else {
      // load straight away
      window[appName][method.name] = method;
    }
  } else if (module) {
    // back-end
    module.exports = method;
  }
}, (typeof window !== 'undefined') ? window[appName] : {
  error: require('../../../backend/helpers/Errors.js'),
  validate: require('../../../backend/helpers/validations.js')
});
