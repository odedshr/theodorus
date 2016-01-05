;(function () {
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
    var values1 = {
        name : 'name',
        description : 'description',
        topicLength : -140,
        opinionLength : -140,
        commentLength : 100,
        minAge : 18,
        maxAge : 30,
        gender : models.community.gender.neutral,
        join : models.community.join.open
    };
    var values2 = {
        name : 'name2',
        description : 'description2',
        topicLength : 0,
        opinionLength : 0,
        commentLength : 0,
        minAge : 66,
        maxAge : 0,
        gender : models.community.gender.female,
        join : models.community.join.invite,
        status : models.community.status.suspended
    };

    describe('CommunityController', function () {

        before(function beforeAllTests(done) {
            helpers.getDBModels(function getModels(newModels) {
                dbModels = newModels;
                helpers.createUser(dbModels,helpers.getTestUsername('community'),'password1',function onSuccess (newAuthToken) {
                    authToken = JSON.parse(Encryption.decode(newAuthToken)).user;
                    done();
                }, function onError (err) {
                    throw new Error (err);
                });
            });
        });


        after (function afterAllTests(done) {
            helpers.cleanTestEnvironment(done);
        });

        describe('Community Create', function () {
            it('should fail to create community with no name', function (done) {
                communityController.add(authToken, undefined, undefined, undefined, undefined, undefined,undefined, undefined, undefined, undefined, undefined, dbModels, function (oCommunity) {
                    assert.equal(oCommunity.message, 'invalid-name');
                    done();
                });
            });

            it('should successfully add a community', function (done) {
                communityController.add(authToken, values1.name, values1.description, values1.status, values1.topicLength, values1.opinionLength, values1.commentLength, values1.minAge, values1.maxAge, values1.gender, values1.join, dbModels, function (oCommunity) {
                    assert.equal(typeof oCommunity.id, 'string', 'added community have id');
                    assert.equal(oCommunity.name, values1.name, 'added community have name');
                    assert.equal(oCommunity.description, values1.description, 'added community have description');
                    assert.equal(oCommunity.topicLength, values1.topicLength, 'added community have id');
                    assert.equal(oCommunity.commentLength, values1.commentLength, 'added community have commentLength');
                    assert.equal(oCommunity.minAge, values1.minAge, 'added community have minAge');
                    assert.equal(oCommunity.maxAge, values1.maxAge, 'added community have maxAge');
                    assert.equal(oCommunity.gender, values1.gender, 'added community have gender');
                    assert.equal(oCommunity.join, values1.join, 'added community have join');
                    done();
                });
            });
        });


        describe('Community Update', function () {
            it('should successfully update a community', function (done) {
                communityController.add(authToken, values1.name, values1.description, values1.status, values1.topicLength, values1.opinionLength, values1.commentLength, values1.minAge, values1.maxAge, values1.gender, values1.join, dbModels, function (oCommunity) {
                    communityController.update(authToken, oCommunity.id, values2.name, values2.description, values2.status, values2.topicLength, values2.opinionLength, values2.commentLength, values2.minAge, values2.maxAge, values2.gender, values2.join, dbModels, function (oCommunity) {
                        assert.equal(typeof oCommunity.id, 'string', 'updated community have id');
                        assert.equal(oCommunity.name, values2.name, 'updated community have name');
                        assert.equal(oCommunity.description, values2.description, 'updated community have description');
                        assert.equal(oCommunity.topicLength, values2.topicLength, 'updated community have topicLength');
                        assert.equal(oCommunity.commentLength, values2.commentLength, 'updated community have commentLength');
                        assert.equal(oCommunity.minAge, values2.minAge, 'updated community have minAge');
                        assert.equal(oCommunity.maxAge, values2.maxAge, 'updated community have maxAge');
                        assert.equal(oCommunity.gender, values2.gender, 'updated community have gender');
                        assert.equal(oCommunity.join, values2.join, 'updated community have join');
                        assert.notEqual(oCommunity.created, values2.modified, 'modified timestamp should differ from created timestamp');
                        done();
                    });
                });
            });
        });

        describe('Community List', function () {
            it('should list all open/upon-request communities', function (done) {
                communityController.list(dbModels, function (communities) {
                    assert.ok(communities.length > 0, 'at least one community loaded');
                    var validStatuses= [models.community.join.open, models.community.join.request];
                    while(communities.length) {
                        assert(validStatuses.indexOf(communities.pop().join) > -1, 'community is open or upon-request');
                    }
                    done();
                });
            });

            it('should not list an invite only community', function (done) {
                var inviteOnly = models.community.join.invite;
                communityController.add(authToken, values1.name, values1.description, values1.status, values1.topicLength, values1.opinionLength, values1.commentLength, values1.minAge, values1.maxAge, values1.gender, inviteOnly, dbModels, function (oCommunity) {
                    communityController.list(dbModels, function (communities) {
                        assert.ok(communities.length > 0, 'at least one community loaded');
                        while(communities.length) {
                            assert.notEqual(communities.pop(), inviteOnly, 'community is not an invite-only');
                        }
                        done();
                    });
                });
            });
        });

        describe('Community Get Single', function () {
            it('should successfully get details of a single community', function (done) {
                communityController.add(authToken, values1.name, values1.description, values1.status, values1.topicLength, values1.opinionLength, values1.commentLength, values1.minAge, values1.maxAge, values1.gender, values1.join, dbModels, function (oCommunity) {
                    communityController.get(oCommunity.id, dbModels, function gotCommunity (oCommunity2) {
                        assert.equal(typeof oCommunity2.id, 'string', 'loaded community have id');
                        assert.equal(oCommunity2.name, values1.name, 'loaded community have name');
                        assert.equal(oCommunity2.description, values1.description, 'loaded community have description');
                        assert.equal(oCommunity2.topicLength, values1.topicLength, 'loaded community have id');
                        assert.equal(oCommunity2.commentLength, values1.commentLength, 'loaded community have commentLength');
                        assert.equal(oCommunity2.minAge, values1.minAge, 'loaded community have minAge');
                        assert.equal(oCommunity2.maxAge, values1.maxAge, 'loaded community have maxAge');
                        assert.equal(oCommunity2.gender, values1.gender, 'loaded community have gender');
                        assert.equal(oCommunity2.join, values1.join, 'loaded community have join');
                        done();
                    });
                });
            });
        });
    });
})();