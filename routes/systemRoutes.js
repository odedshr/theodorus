(function systemControllerClosure() {
  'use strict';

  //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controllers) {
     return {
       '/system/ping': {
         get: {
           description: 'Return an authenticationToken',
           parameters: { connectionToken: 'string' },
           response: { '200': {authenticationToken: 'string' }},
           handler: controllers.system.ping
         }
       },
       '/system/version': {
         get: {
           description: 'Return an authenticationToken',
           parameters: { connectionToken: 'string' },
           response: { '200': {version: 'string' }},
           handler: controllers.system.getVersion
         }
       },
       '/system/api': {
         get: {
           description: 'Return a JSON of the rest API',
           parameters: {},
           response: { '200': { api: 'string' }},
           handler: controllers.system.api
         }
       }
     };
   };
})();