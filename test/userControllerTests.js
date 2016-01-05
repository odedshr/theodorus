(function () {
    'use strict';

    var should = require('should');
    var assert = require('assert');
    var winston = require('winston');
    var md5 = require('md5');
    var config = require('../helpers/config.js');
    var db = require('../helpers/db.js');
    var Encryption = require ('../helpers/Encryption.js');
    var helpers = require ('./controllerTestsHelpers.js');
    var controller = require('../controllers/userController.js');

    var dbModels = {};
    var testPassword = 'password1';
    var testPassword2 = 'password2';

    xdescribe('UserController', function() {

        before(function beforeAllTests(done) {
            db.connect(config("dbConnectionString", true), function getModels(newModels) {
                dbModels = newModels;
                helpers.removeAllTestsArtifcats(dbModels, done);
            });
        });

        after (function afterAllTests(done) {
            helpers.removeAllTestsArtifcats(dbModels, done);
        });

        describe('Sign-up success', function () {
            it('should successfully sign up', function () {
                var email = helpers.getTestUsername('SignUp');
                controller.signup(email, testPassword, {}, dbModels, function (authToken) {
                    assert.equal(JSON.parse(Encryption.decode(authToken)).email,email);
                });
            });
        });
        describe('Sign-up fail on user-already-exists', function () {
            it('should fail to sign up if user already exists', function () {});
        });
        describe('Sign-in', function () {
            it('should return successfully sign in', function () {});
        });
        describe('Sign-in fail on bad username', function () {
            it('should return successfully sign in', function () {});
        });
        describe('Sign-in failed on bad password', function () {
            it('should return successfully sign in', function () {});
        });
        describe('Remove-user', function () {
            it('should successfully remove a user', function () {});
        });
        describe('Account-exists:false', function () {
            it('should return false if account doens\'t exists', function () {});
        });
        describe('Account-exists:true', function () {
            it('should return true if account exists', function () {});
        });

        describe('Reset Password', function () {
            it('should successfully reset password', function () {});
        });

        describe('Reset Password token expires after sign-in', function () {
            it('should fail to reset password after sign-in', function () {});
        });

        describe('Change Password', function () {
            it('should successfully change password', function () {});
        });

        describe('List User\'s Communities', function () {
            it('should list all communities of a member', function () {});
        });

        describe('User\'s Request list', function () {
            it('should list user\'s community join-requests', function () {});
        });

        describe('User\'s Invitation List', function () {
            it('should list all invitations received by the user', function () {});
        });
    });
})();