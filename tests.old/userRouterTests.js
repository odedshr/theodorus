(function () {
  /*
   * user
   /user/connect [get, post]
   send mail, get token, use token to get authToken
   communities
   /community [get, put]
   get empty list
   fail to add community with no name
   fail to add community with no founder name
   add community, check if founderImage was saved
   get list with one item
   try adding community with existing name
   /community/exists [post]
   check existing name
   check non-existing name
   empty string = already exists
   /community/[communityId] [get, post, delete]
   get community info
   update community description
   fail to delete community if more than one member
   fail to delete community if member != current user
   delete community
   memberships
   /community/[communityId]/membership [get, put]
   get list of member
   fail to add member with existing name
   failed to add member with no name
   add a member, verify image exists
   /community/[communityId]/quit [get]
   remove a member
   /membership [get]
   ??
   /membership/[membershipId]/ [get, post, delete]
   get member details as member's user
   get member detail as another user
   fail to update member to existing name
   fail to delete member if not user
   quit community
   /membership/exists [post]
   check existing name
   check non-existing name
   empty string = already exists
   requests
   /community/[communityId]/requests [get, put, delete]
   fail to get list of requests if not member
   get list of requests
   fail to add request if already member
   add new request
   fail to reject request if not member && not user
   reject request
   cancel request
   /membership/[membershipId]/reject [get]
   fail to reject request if not member
   reject request
   /request/[requestId]/ [get, post, delete]
   fail to get request if not member or user
   get request
   fail to update request if not user
   update request
   fail to delete request if not user
   delete request
   invitations
   /community/[communityId]/decline [get]
   fail to decline if no invitation
   /community/[communityId]/invitations [get, put]
   /user/invitations [get]
   profileImage
   /membership/image [get]
   /membership/[membershipId]/image [get, put, delete]
   topics
   /community/[communityId]/topics [get, put]
   /topic [post]
   /topic/[topicId] [get, post ,delete]
   opinions
   /topic/[topicId]/opinions [get, put]
   /opinion [post]
   /opinion/[opinionId] [get, post, delete]
   comments
   /opinion/[opinionId]/comments [get, put]
   /comment [put]
   /comment/[commentId] [get, post, delete]
   /comment/[commentId]/comments [get, put]
   viewpoints
   /[subjectType]/[subjectId]/read [get,delete]
   /[subjectType]/[subjectId]/unread [get,delete]
   /[subjectType]/[subjectId]/follow [get,delete]
   /[subjectType]/[subjectId]/unfollow [get,delete]
   /[subjectType]/[subjectId]/endorse [get,delete]
   /[subjectType]/[subjectId]/unendorse [get,delete]
   /[subjectType]/[subjectId]/report [put,delete]
   feedbacks
   /feedback [put]
   System
   /system/ping [get]
   /system/version [get]
   /system/api [get]
   * */

  'use strict';

  var should = require('should');
  var assert = require('assert');
  var winston = require('winston');
  var request = require('supertest');
  var md5 = require('md5');
  var config = require('../helpers/config.js');
  var db = require('../helpers/db.js');

  var dbModels = {};
  var url = 'http://127.0.0.1:8080';
  var testId = (new Date()).getTime();
  var testPassword = 'password1';
  var testPassword2 = 'password2';

  function getTestUsername (testName) {
    return 'tstRtr'+testId+'+'+testName+'@theodorus.com';
  }
  function removeAllTestAccountAndUsers (callback) {
    dbModels.user.find({password:[md5(testPassword),md5(testPassword2)]}, function (err,users) {
      if (err) {
        throw err;
      }
      users.forEach (function (user) {
        user.remove ();
      });
      if (callback !== undefined) {
        callback ();
      }
    });
  }

  function createUser (email, onSuccess,onError) {
    request(url)
      .post('/signup')
      .send({email: email, password: testPassword})
      .expect(200) //Status code
      .end(onResponse.bind(null,onSuccess,onError));
  }
  function onResponse (onSuccess, onError, err, res) {
    if (err) {
      onError(err);
    } else {
      onSuccess(JSON.parse(res.text));
    }
  }
  function removeUser (token, onSuccess, onError) {
    request(url)
      .delete('/user')
      .set('Authorization', token)
      .expect(200) //Status code
      .end(onResponse.bind(null,onSuccess,onError));
  }
  function signinUser (email, password,onSuccess,onError) {
    request(url)
      .post('/signin')
      .send({email: email, password: password})
      .expect(200) //Status code
      .end(onResponse.bind(null,onSuccess,onError));
  }
  function exists (email,onSuccess,onError) {
    request(url)
      .get('/user/exists/' + email)
      .expect(200) //Status code
      .end(onResponse.bind(null,onSuccess,onError));
  }

  xdescribe('AccountRouter', function() {

    before(function beforeAllTests(done) {
      db.connect(config("dbConnectionString", true), function getModels(newModels) {
        dbModels = newModels;
        removeAllTestAccountAndUsers(done);
      });
    });

    after (function afterAllTests(done) {
      removeAllTestAccountAndUsers(done);
    });

    describe('Sign-up success', function () {
      it('should successfully sign up', function (done) {
        createUser(getTestUsername('SignUp'),function userCreated () {
          done();
        }, done);
      });
    });
    describe('Sign-up fail on user-already-exists', function () {
      it('should fail to sign up if user already exists', function (done) {
        var email = getTestUsername('AlreadyExists');
        createUser(email,function () {
          request(url)
            .post('/signup')
            .send({email: email, password: testPassword})
            .expect(409) //Status code
            .end(function (err) {
              done(err);
            });
        }, done);
      });
    });
    describe('Sign-in', function () {
      it('should return successfully sign in', function (done) {
        var email = getTestUsername('SignIn');
        createUser(email,function () {
          request(url)
            .post('/signin')
            .send({email: email, password: testPassword})
            .expect(200) //Status code
            .end(function (err) {
              done(err);
            });
        }, done);
      });
    });
    describe('Sign-in fail on bad email', function () {
      it('should return successfully sign in', function (done) {
        var email = getTestUsername('SignInFailBadUser');
        createUser(email,function () {
          request(url)
            .post('/signin')
            .send({email: 'x'+email, password: testPassword})
            .expect(404) //Status code
            .end(function (err) {
              done(err);
            });
        }, done);
      });
    });
    describe('Sign-in failed on bad password', function () {
      it('should return successfully sign in', function (done) {
        var email = getTestUsername('SignInFailBadPass');
        createUser(email,function () {
          request(url)
            .post('/signin')
            .send({email: email, password: testPassword+'x'})
            .expect(401) //Status code
            .end(function (err) {
              done(err);
            });
        }, done);
      });
    });
    describe('Remove-user', function () {
      it('should successfully remove a user', function (done) {
        var email = getTestUsername('Remove');
        createUser(email,function (token) {
          removeUser(token, function () {
            exists(email, function (existsResult) {
              assert.equal(false, existsResult);
              done();
            });
          }, done);
        }, done);
      });
    });
    describe('Account-exists:false', function () {
      it('should return false if user doens\'t exists', function (done) {
        request(url)
          .get('/user/exists/email.not.exists@gmail.com')
          .expect(200) //Status code
          .end(function (err, res) {
            if (!err) {
              assert.equal(false, JSON.parse(res.text));
            }
            done(err);
          });
      });
    });
    describe('Account-exists:true', function () {
      it('should return true if user exists', function (done) {
        var email = getTestUsername('Exists');
        createUser(email,function () {
          request(url)
            .get('/user/exists/'+email)
            .expect(200) //Status code
            .end(function (err, res) {
              if (!err) {
                assert.equal(true, JSON.parse(res.text));
              }
              done(err);
            });
        }, done);
      });
    });

    function signInRemoveAndCheckExists(email, password, done) {
      signinUser (email, password, function signInRemoveAndCheckExistsOnSignInUser(token) {
        removeUser(token, function signInRemoveAndCheckExistsOnRemveUser() {
          exists(email, function signInRemoveAndCheckExistsOnExists(existsResult) {
            assert.equal(false, existsResult);
            done();
          }, done);
        }, done);
      }, done);
    }

    describe('Reset Password', function () {
      it('should successfully reset password', function (done) {
        var email = getTestUsername('ResetPassword');
        createUser(email, function onUserCreated () {
          request(url)
            .get('/user/password/' + email)
            .expect(200)
            .end(function onPasswordTokenGenerated (err, res) {
              if (err) {
                done(err);
              } else {
                request(url)
                  .put('/user/password')
                  .send({email: email, token: JSON.parse(res.text), newPassword: testPassword2})
                  .expect(200) //Status code
                  .end(function onPasswordReset (err) {
                    if (err) {
                      done(err);
                    } else {
                      signInRemoveAndCheckExists(email, testPassword2, done);
                    }
                  });
              }
            });
        }, done);
      });
    });

    describe('Reset Password token expires after sign-in', function () {
      it('should fail to reset password after sign-in', function (done) {
        var email = getTestUsername('ResetPasswordAfterSigin');
        createUser(email,function () {
          request(url)
            .get('/user/password/'+email)
            .expect(200)
            .end(function (err,res) {
              if (err) {
                done(err);
              } else {
                var tokenTime = (new Date()).getTime() + 1000; //wait for one second
                var count = 0;
                while (tokenTime > (new Date()).getTime()) {
                  // do nothing, just wait for the token expires
                  count++;
                }
                signinUser (email, testPassword,function () {
                  request(url)
                    .put('/user/password')
                    .send({email: email, token:JSON.parse(res.text), newPassword: testPassword2})
                    .expect(403) //Status code
                    .end(function (err) {
                      if (err) {
                        done (err);
                      } else {
                        signInRemoveAndCheckExists(email, testPassword2, done);
                      }
                    });
                },done);
              }
            });
        }, done);
      });
    });

    describe('Change Password', function () {
      it('should successfully change password', function (done) {
        var email = getTestUsername('ChangePassword');
        createUser(email,function (token) {
          request(url)
            .post('/user/password')
            .set('Authorization', token)
            .send({oldPassword:testPassword, newPassword: testPassword2})
            .expect(200) //Status code
            .end(function (err) {
              if (err){
                done(err);
              }
              signInRemoveAndCheckExists(email, testPassword2, done);
            });
        }, done);
      });
    });
  });
})();