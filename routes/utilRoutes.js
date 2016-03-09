(function userControllerClosure() {
    'use strict';

    //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controller, validators) {
       if (controller === undefined) {
           controller = require('../controllers/utilController');
       }

       return [
           { method: 'get', url: new RegExp('^\\/email\\/?$'), handler: controller.getEmail },
           { method: 'get', url: new RegExp('^\\/ping\\/?$'), handler: controller.ping },
           { method: 'get', url: new RegExp('^\\/version\\/?$'), handler: controller.version }
       ];
   };
})();