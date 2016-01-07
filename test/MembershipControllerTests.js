(function () {
    'use strict';

    var should = require ('should');
    var assert = require ('assert');
    var winston = require ('winston');
    var md5 = require ('md5');
    var Encryption = require ('../helpers/Encryption.js');
    var models = require ('../helpers/models.js');
    var userController = require ('../controllers/userController.js');
    var communityController = require ('../controllers/communityController.js');
    var membershipController = require ('../controllers/membershipController.js');
    var helpers = require ('./controllerTestsHelpers.js');

    var dbModels = {};
    var authTokenFounder, authTokenAccept, authTokenReject;
    var membershipId;
    var communities = {};

    describe('MembershipController', function () {

        before(function beforeAllTests(done) {
            var tasks = [done];

            helpers.getDBModels(function gotModels(newModels) {
                dbModels = newModels;
                helpers.createUser(dbModels,helpers.getTestUsername('membershipFounder'),'password1',function onSuccess (newAuthToken) {
                    authTokenFounder = JSON.parse(Encryption.decode(newAuthToken)).user;
                    tasks.push(helpers.createUser.bind(null,dbModels,helpers.getTestUsername('membershipAccept'),'password1',function onSuccess (newAuthToken) {
                        authTokenAccept = JSON.parse(Encryption.decode(newAuthToken)).user;
                        var birthDate = new Date();
                        birthDate.setYear(birthDate.getYear-20);
                        userController.update(authTokenAccept, birthDate, true, dbModels, function () {
                            (tasks.pop())();
                        });
                    }));
                    tasks.push(helpers.createUser.bind(null,dbModels,helpers.getTestUsername('membershipReject'),'password1',function onSuccess (newAuthToken) {
                        authTokenReject = JSON.parse(Encryption.decode(newAuthToken)).user;
                        var birthDate = new Date();
                        birthDate.setYear(birthDate.getYear-20);
                        userController.update(authTokenReject, birthDate, false, dbModels, function () {
                            (tasks.pop())();
                        });
                    }));
                    tasks.push(communityController.add.bind(null,authTokenFounder, 'openCommunity', '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, models.community.join.open, dbModels, function (oCommunity) {
                        communities.open = oCommunity;
                        (tasks.pop())();
                    }));
                    tasks.push(communityController.add.bind(null,authTokenFounder, 'requestCommunity', '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, models.community.join.request, dbModels, function (oCommunity) {
                        communities.request = oCommunity;
                        (tasks.pop())();
                    }));
                    tasks.push(communityController.add.bind(null,authTokenFounder, 'inviteCommunity', '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, models.community.join.invite, dbModels, function (oCommunity) {
                        communities.invite = oCommunity;
                        (tasks.pop())();
                    }));
                    tasks.push(communityController.add.bind(null,authTokenFounder, 'genderCommunity', '', undefined, undefined, undefined, undefined, undefined, undefined, models.community.gender.female, models.community.join.open, dbModels, function (oCommunity) {
                        communities.gender = oCommunity;
                        (tasks.pop())();
                    }));
                    tasks.push(communityController.add.bind(null,authTokenFounder, 'maxAgeCommunity', '', undefined, undefined, undefined, undefined, undefined, 21, undefined, models.community.join.open, dbModels, function (oCommunity) {
                        communities.maxAge = oCommunity;
                        (tasks.pop())();
                    }));
                    tasks.push(communityController.add.bind(null,authTokenFounder, 'minAgeCommunity', '', undefined, undefined, undefined, undefined, 18, undefined, undefined, models.community.join.open, dbModels, function (oCommunity) {
                        communities.minAge = oCommunity;
                        (tasks.pop())();
                    }));
                    (tasks.pop())();
                }, function onError (err) {
                    throw new Error (err);
                });
            });
        });
        after (function afterAllTests(done) {
            helpers.cleanTestEnvironment(done);
        });

        describe('Join a Community', function () {
            it('should join an open community', function (done) {
                membershipController.add(authTokenAccept,undefined, communities.open.id, dbModels, function (membership) {
                    membershipId = membership.id;
                    assert.equal(typeof membership.id, 'string', 'added membership have id');
                    assert.equal(membership.join,models.community.join.open,"community is opened");
                    assert.equal(membership.status,models.membership.status.active,"membership status is active");
                    done();
                });
            });

            it('should join self\'s request-only community', function (done) {
                membershipController.add(authTokenFounder,undefined, communities.request.id, dbModels, function (membership) {
                    assert.equal(typeof membership.id, 'string', 'added membership have id');
                    assert.equal(communities.request.join,models.community.join.request,"community is request-only");
                    assert.equal(membership.join,models.community.join.open,"membership is join.open");
                    assert.equal(membership.status,models.membership.status.active,"membership status is active");
                    done();
                });
            });


            describe('Request to join communities',function () {
                var request1 = null;
                var request2 = null;
                it('should send request', function (done) {
                    membershipController.add(authTokenReject,undefined, communities.request.id, dbModels, function (requestedMembership1) {
                        assert.equal(requestedMembership1.status,models.membership.status.requested,"membership status is invite");
                        request1 = requestedMembership1;
                        membershipController.add(authTokenAccept,undefined, communities.request.id, dbModels, function (requestedMembership2) {
                            assert.equal(requestedMembership2.status,models.membership.status.requested,"membership status is requested");
                            request2 = requestedMembership2;
                            done();
                        });
                    });
                });

                it('should list all members of community', function (done) {
                    membershipController.requests(authTokenFounder, communities.request.id, dbModels, function (members) {
                        assert.equal(members.length, 2, 'got list of one request');
                        done();
                    });
                });

                it('should send request, get rejected', function (done) {
                    membershipController.reject (authTokenFounder,request1.id, dbModels, function (rejectedMembership) {
                        assert.equal(rejectedMembership.id,request1.id,"accepted invite has same ID as invitation");
                        assert.equal(rejectedMembership.join,models.community.join.request,"membership is join.invite");
                        assert.equal(rejectedMembership.status,models.membership.status.rejected,"membership status is active");
                        done();
                    });
                });
                it('should send request, get approved', function (done) {
                    membershipController.add(authTokenFounder,authTokenAccept.email, communities.request.id, dbModels, function (approvedMembership) {
                        assert.equal(approvedMembership.id,request2.id,"accepted invite has same ID as requested");
                        assert.equal(approvedMembership.status,models.membership.status.active,"membership status is active");
                        done();
                    });
                });
            });


            it('should fail to join community due to gender', function (done) {
                membershipController.add(authTokenReject,undefined, communities.gender.id, dbModels, function (error) {
                    assert.equal(error.message, 'user-not-fit-for-community', 'user unfit due to gender');
                    done();
                });
            });

            it('should successed to join community albeit gender', function (done) {
                membershipController.add(authTokenAccept,undefined, communities.gender.id, dbModels, function (acceptedMembership) {
                    assert.equal(typeof acceptedMembership.id, 'string', 'added membership have id');
                    done();
                });
            });

            it('should fail to join community due to min-age', function (done) {
                membershipController.add(authTokenAccept,undefined, communities.minAge.id, dbModels, function (error) {
                    assert.equal(error.message, 'user-not-fit-for-community', 'user unfit due to gender');
                    done();
                });
            });

            it('should fail to join community due to max-age', function (done) {
                membershipController.add(authTokenAccept,undefined, communities.maxAge.id, dbModels, function (error) {
                    assert.equal(error.message, 'user-not-fit-for-community', 'user unfit due to gender');
                    done();
                });
            });
        });

        describe('Leave community', function () {
            it('should leave a community, posts should be marked as non-existing-user', function (done) {
                membershipController.quit(authTokenAccept, communities.gender.id, dbModels, function (quitMembership) {
                    assert.equal(quitMembership.status, models.membership.status.quit, 'membership is status quit');
                    done();
                });
            });
        });

        describe('List Community members', function () {
            it('should list all members of community', function (done) {
                membershipController.list(authTokenFounder, communities.request.id, dbModels, function (members) {
                    assert.equal(members.length, 2, 'got list of two members');
                    done();
                });
            });
        });

        describe('Invitations List', function () {
            it('should receive an invite, accept and then decline', function (done) {
                membershipController.add(authTokenFounder,undefined, communities.invite.id, dbModels, function (founderMembership) {
                    assert.equal(typeof founderMembership.id, 'string', 'added membership have id');
                    membershipController.add(authTokenFounder,authTokenAccept.email, communities.invite.id, dbModels, function (invitedMembership) {
                        assert.equal(invitedMembership.status,models.membership.status.invited,"membership status is invite");
                        membershipController.add(authTokenAccept,undefined, communities.invite.id, dbModels, function (acceptedMembership) {
                            assert.equal(acceptedMembership.id,invitedMembership.id,"accepted invite has same ID as invitation");
                            assert.equal(acceptedMembership.join,models.community.join.invite,"membership is join.invite");
                            assert.equal(acceptedMembership.status,models.membership.status.active,"membership status is active");
                            done();
                        });
                    });
                });
            });

            it('should receive an invite, decline', function (done) {
                membershipController.add(authTokenFounder,authTokenReject.email, communities.invite.id, dbModels, function (invitedMembership) {
                    var membershipIdToken = Encryption.encode(invitedMembership.id);
                    membershipController.decline(membershipIdToken, dbModels, function (declinedMembership) {
                        assert.equal(declinedMembership.id,invitedMembership.id,"accepted invite has same ID as invitation");
                        assert.equal(declinedMembership.status,models.membership.status.declined,"membership status is declined");
                        done();
                    });
                });
            });

            it('should list all invitations sent by a member', function (done) {
                membershipController.invitations(authTokenFounder, communities.invite.id, dbModels, function (members) {
                    assert.equal(members.length, 2, 'got list of two members');
                    assert.equal(members[0].status, models.membership.status.active, 'membership status is active');
                    assert.equal(members[1].status, models.membership.status.declined, 'membership status is declined');
                    done();
                });
            });
        });

        describe('List Current Member\'s Communities', function () {
            var membershipId = false;
            it('should list all communities of current user', function (done) {
                membershipController.listCommunities(authTokenFounder, false, dbModels, function (communities) {
                    assert.ok(!(communities instanceof Error), 'didn\'t get an error in return');
                    assert.equal(communities.length, 2, 'got list of two communities');
                    assert.equal(communities[0].membershipStatus, models.membership.status.active, 'should have an membership status');
                    membershipId = communities[0].membershipId;
                    done();
                });
            });

            it('should list all communities of a member', function (done) {
                assert.ok(membershipId !== undefined, 'membershipId != null');
                membershipController.listCommunities(authTokenAccept, membershipId, dbModels, function (communities) {
                    assert.ok(!(communities instanceof Error), 'didn\'t get an error in return');
                    assert.equal(communities.length, 2, 'got list of two communities');
                    assert.ok(communities[0].membershipStatus === undefined, 'should not have an membership status');
                    done();
                });
            });
        });

        describe('Update Membership details', function () {
            it('should fail to update membership with no ID', function (done) {
                membershipController.update(authTokenAccept, {}, dbModels, function (error) {
                    assert.ok(error instanceof Error, 'got an error message');
                    done();
                });
            });
            it('should update membership details', function (done) {
                var data = {
                    id: membershipId,
                    name: 'member ship name',
                    description: 'my description'
                };
                assert.ok(membershipId !== undefined, 'membershipId != null');
                membershipController.update(authTokenAccept, data, dbModels, function (membership) {
                    assert.ok(!(membership instanceof Error), 'didn\'t get an error in return');
                    assert.equal(membership.name, data.name, 'updated membership has new name');
                    assert.equal(membership.description, data.description, 'updated membership has new description');
                    done();
                });
            });
        });


    });
})();