(function userControllerClosure() {
    'use strict';

    //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/userController');
       }

       return [
            { method: 'get', url: new RegExp('^\\/ping\\/?$'), handler: controller.ping },
            { method: 'post', url: new RegExp('^\\/signin\\/?$'), handler: controller.signin },
            { method: 'post', url: new RegExp('^\\/signup\\/?$'), handler: controller.signup },
            { method: 'delete', url: new RegExp('^\\/user\\/?$'), handler: controller.remove },
            { method: 'get', url: new RegExp('^\\/user\\/exists\/' + validators.emailPatternString + '\/?'), handler: controller.exists, parameters: { email: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/user\\/password\/' + validators.emailPatternString + '\/?'), handler: controller.generateResetPasswordToken, parameters: { email: {alias: '0' }} },
            { method: 'put', url: new RegExp('^\\/user\\/password\\/?$'), handler: controller.resetPassword },
            { method: 'post', url: new RegExp('^\\/user\\/password\\/?$'), handler: controller.changePassword }
       ];
   };
})();