(function () {
    'use strict';

    var should = require ('should');
    var assert = require ('assert');
    var winston = require ('winston');
    var md5 = require ('md5');
    var Encryption = require ('../helpers/Encryption.js');
    var communityController = require ('../controllers/communityController.js');
    var membershipController = require ('../controllers/membershipController.js');
    var topicController = require ('../controllers/topicController.js');
    var opinionController = require ('../controllers/opinionController.js');
    var commentController = require ('../controllers/commentController.js');
    var helpers = require ('./controllerTestsHelpers.js');

    var db = {};
    var authToken, communityId, membershipId ;
    var topicId, opinionId, commentId, comment2Id ;

    describe('PostsController', function () {

        before(function beforeAllTests (done) {
            helpers.getDBModels (function getModels(newModels) {
                db = newModels;
                helpers.createUser (db,helpers.getTestUsername ('post'),'password1',function onSuccess (newAuthToken) {
                    authToken = JSON.parse (Encryption.decode (newAuthToken)).user;
                    communityController.add (authToken, 'community', '', undefined, 7, -10, -10, undefined, undefined, undefined, db.community.model.type.public, 'founder', db, function (oCommunity) {
                        communityId = oCommunity.id;
                        membershipId = oCommunity.membership.id;
                        done();
                    });
                }, function onError (err) {
                    throw new Error (err);
                });
            });
        });

         after (function afterAllTests(done) {
             helpers.cleanTestEnvironment(done);
         });


        describe('Topic', function () {
            it('should topic a topic to a community', function (done) {
                var topicContent = 'my topic';
                topicController.add(authToken, communityId, topicContent, db.topic.model.status.published, db, function (topic) {
                    assert.equal(topic.content,topicContent,'content should be as expected');
                    assert.equal(topic.author.id,membershipId,'should have the right membershipId');
                    topicId = topic.id;
                    done();
                });
            });

            it('should sanitized content', function (done) {
                var unsanitizedContent = 'my content has <tags> and "brackets" and \'quotes\'';
                topicController.add(authToken, communityId, unsanitizedContent, undefined, db, function (topic) {
                    assert.ok(topic.content.indexOf('>') === -1,'content should be sanitized');
                    assert.equal(topic.author.id,membershipId,'should have the right membershipId');
                    done();
                });
            });

            it('should fail to topic if content too long', function (done) {
                var contentTooLong = 'my content is more than the seven words limits';
                topicController.add(authToken, communityId, contentTooLong, undefined, db, function (response) {
                    assert.ok(response instanceof Error,'response is error');
                    assert.equal(response.message,'topic-too-long','should complain about topic length');
                    done();
                });
            });

            it('should fail topic to an unknown community', function (done) {
                var topicContent = 'wrong community';
                topicController.add(authToken, '1', topicContent, db.topic.model.status.published, db, function (response) {
                    assert.ok(response instanceof Error,'response is error');
                    assert.equal(response.message,'failed-to-load-community','should complain about no community');
                    done();
                });
            });

            it('should fail to topic if no permissions', function (done) {
                db.membership.get(Encryption.unmask(membershipId),function (error, membership) {
                    delete membership.permissions.suggest;
                    membership.save(function () {
                        var topicContent = 'no permissions';
                        topicController.add(authToken, communityId, topicContent, db.topic.model.status.published, db, function (response) {
                            assert.ok(response instanceof Error,'response is error');
                            assert.equal(response.message,'no-permissions-to-suggest','should complain about no permissions');
                            done();
                        });
                    });
                });
            });
        });

        describe('Opinion', function () {
            it('should add an opinion to a community', function (done) {
                var opinionContent = 'my opinion';
                opinionController.add(authToken, topicId,opinionContent, db.opinion.model.status.published, db, function (opinion) {
                    assert.equal(opinion.content,opinionContent,'content should be as expected');
                    assert.equal(opinion.author.id,membershipId,'should have the right membershipId');
                    opinionId = opinion.id;
                    done();
                });
            });

            it('should add one opinion per member for topic', function (done) {
                var opinionContent = 'opinion2';
                opinionController.add(authToken, topicId,opinionContent, db.opinion.model.status.published, db, function (opinion) {
                    assert.equal(opinion.content,opinionContent,'content should be as expected');
                    opinionId = opinion.id;
                    opinionController.list(authToken, topicId, db, function (opinions) {
                        assert.equal(opinions.length,1,'list contains 1 opinion');
                        assert.equal(opinions[0].id,opinionId,'opinion is the last update');
                        assert.equal(opinions[0].history.length,1,'opinion has 1 history item');

                        done();
                    });
                });
            });

            it('should update an opinion to a community', function (done) {
                assert.ok(opinionId !== undefined,'Should have an opinion to update');
                var opinionContent = 'opinion3';
                opinionController.update(authToken, {
                    id: opinionId,
                    content: opinionContent
                }, db, function (opinion) {
                    assert.equal(opinion.content,opinionContent,'content should be as expected');
                    assert.equal(opinion.author.id,membershipId,'should have the right membershipId');
                    opinionId = opinion.id;
                    opinionController.list(authToken, topicId, db, function (opinions) {
                        assert.equal(opinions.length,1,'list contains 1 opinion');
                        assert.equal(opinions[0].id,opinionId,'opinion is the last update');
                        assert.equal(opinions[0].history.length,1,'opinion has 1 history item');

                        done();
                    });
                });
            });

            it('should fail to opinion an opinion if no permissions', function (done) {
                db.membership.get(Encryption.unmask(membershipId),function (error, membership) {
                    delete membership.permissions.opinionate;
                    membership.save(function () {
                        var opinionContent = 'no permissions';
                        opinionController.add(authToken, topicId,opinionContent, db.opinion.model.status.published, db, function (response) {
                            assert.ok(response instanceof Error,'response is error');
                            assert.equal(response.message,'no-permissions-to-opinionate','should complain about no permissions');
                            done();
                        });
                    });
                });
            });

        });

        describe('Comment', function () {
            it('should comment an opinion', function (done) {
                var commentContent = 'my comment';
                commentController.add(authToken, opinionId, undefined, commentContent, db.comment.model.status.published, db, function (comment) {
                    assert.equal (comment.content,commentContent,'content should be as expected');
                    assert.equal (comment.author.id,membershipId,'should have the right membershipId');
                    commentId = comment.id;
                    done();
                });
            });

            it('should comment a comment', function (done) {
                var commentContent = 'comment2';
                commentController.add(authToken, undefined, commentId,commentContent, db.comment.model.status.published, db, function (comment) {
                    assert.equal (comment.content,commentContent,'content should be as expected');
                    assert.equal (comment.author.id,membershipId,'should have the right membershipId');
                    comment2Id = comment.id;
                    done();
                });
            });

            it('should update a comment', function (done) {
                assert.ok(comment2Id !== undefined,'I have an comment to update');
                var commentContent = 'updated';
                commentController.update(authToken, {
                    id: comment2Id,
                    content: commentContent
                }, db, function (comment) {
                    assert.equal(comment.content,commentContent,'content should be as expected');
                    assert.equal(comment.author.id,membershipId,'should have the right membershipId');
                    opinionId = comment.id;
                    commentController.list(authToken, undefined, commentId, db, function (opinions) {
                        assert.equal(opinions.length,1,'list contains 1 comment');
                        assert.equal(opinions[0].id,opinionId,'opinion is the last update');
                        done();
                    });
                });
            });

            it('should fail to update comment with children', function (done) {
                assert.ok(commentId !== undefined,'should have an comment to update');
                var commentContent = 'updated2';
                commentController.update(authToken, {
                    id: commentId,
                    content: commentContent
                }, db, function (response) {
                    assert.ok(response instanceof Error,'response is error');
                    assert.equal(response.message,'immutable-comment','should complain about immutable comment');
                    done();
                });
            });

            it('should fail to comment if content too long', function (done) {
                var contentTooLong = 'my content is more than the seven characters limits';
                commentController.add(authToken, opinionId, undefined, contentTooLong, undefined, db, function (response) {
                    assert.ok(response instanceof Error,'response is error');
                    assert.equal(response.message,'comment-too-long','should complain about comment length');
                    done();
                });
            });

            it('should fail to comment if no permissions', function (done) {
                db.membership.get(Encryption.unmask(membershipId),function (error, membership) {
                    delete membership.permissions.comment;
                    membership.save(function () {
                        var commentContent = 'no permissions';
                        commentController.add(authToken, opinionId, undefined, commentContent, db.comment.model.status.published, db, function (response) {
                            assert.ok (response instanceof Error,'response is error');
                            assert.equal (response.message,'no-permissions-to-comment','should complain about no permissions');
                            done();
                        });
                    });
                });
            });
        });

        describe ('Get Topic', function () {
            it('should get a topic to a single topic', function (done) {
                var topicContent = 'my topic';
                topicController.get(authToken, topicId, db, function (topic) {
                    assert.equal(topic.content,topicContent,'my topic');
                    assert.equal(topic.author.id,membershipId,'The author should have id');
                    topicId = topic.id;
                    done();
                });
            });
        });

        describe ('Get Topic list', function () {
            it('should get a list of topic', function (done) {
                topicController.list(authToken, communityId, db, function (topics) {
                    assert.equal(topics.length,2,'list should contain 2 topics');
                    assert.equal(topics[1].author.id,membershipId,'The author should have id');
                    done();
                });
            });
        });
    });
})();