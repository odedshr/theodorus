(function () {
    'use strict';

    var should = require ('should');
    var assert = require ('assert');
    var winston = require ('winston');
    var md5 = require ('md5');
    var Encryption = require ('../helpers/Encryption.js');
    var models = require ('../helpers/models.js');
    var communityController = require ('../controllers/communityController.js');
    var helpers = require ('./controllerTestsHelpers.js');

    var dbModels = {};
    var authToken;
    var testPassword = 'password1';

    describe('ConversationController', function () {

        /*before(function beforeAllTests(done) {
         helpers.getDBModels(function getModels(newModels) {
         dbModels = newModels;
         helpers.createUser(dbModels,helpers.getTestUsername('community'),testPassword,function onSuccess (newAuthToken) {
         authToken = JSON.parse(Encryption.decode(newAuthToken)).user;
         done();
         }, function onError (err) {
         throw new Error (err);
         });
         });
         });

         after (function afterAllTests(done) {
         helpers.cleanTestEnvironment(done);
         });*/

        describe('Message', function () {
            it('should send a message do another user', function () {});

            it('should fail to send message to user that blocked you', function () {});
        });

    });
})();