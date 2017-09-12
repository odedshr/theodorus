(function userControllerClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/feedback': {
        post: {
          description: 'Send a feedback about the system',
          parameters: { email: 'string', image: 'base64', content: 'string', url: 'string' },
          response: {'200': {}},
          handler: controllers.feedback.set
        }
      }
    };
  };
})();