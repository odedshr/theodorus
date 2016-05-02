(function userControllerClosure() {
    'use strict';

    //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controllers) {
       return {
         '/user/test': {
           get: {
             description: 'Return an authenticationToken',
             parameters: {},
             response: {'200': {}},
             handler: controllers.user.testEmail
           }
         },
         '/user/connect': {
           post: {
             description: 'Send the email an connectionToken',
             parameters: {email: 'string', title: 'string', content: 'string'},
             response: {'200': {}},
             handler: controllers.user.connect
           }
         },
         '/user/connect/[token]': {
           get: {
             description: 'Return an authenticationToken',
             parameters: {token: 'string'},
             response: {'200': {authenticationToken: 'string'}},
             handler: controllers.user.authenticate
           }
         },
         '/user': {
           get: {
             description: 'get user details',
             parameters: {},
             response: {'200': { user: 'user' }},
             handler: controllers.user.get
           },
           post: {
             description: 'set user details',
             parameters: { user: 'user' },
             response: {'200': { user: 'user' }},
             handler: controllers.user.set
           }
         }
       };
   };
})();