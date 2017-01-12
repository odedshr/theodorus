(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');

  var testUtils = require('./testUtils.js');

  describe('communityRouterRouter', function() {
    var founderToken, communityId, founderId;
    var testId = (new Date()).getTime();
    var founderEmail = 'founder-' + testId + '@test.suite.comment';

    var communityName = 'comment-public-' + testId;
    var founderName = 'comment-public-founder-' + testId;

    var topicId, opinionId, commentId, subCommentId;
    var topicContent = 'topic2';
    var opinionContent = 'opinion2';
    var commentContent1 = 'content1';
    var commentContent2 = 'content2';
    var commentContent3 = 'content3';
    var subCommentContent = 'subComment';

    before(function beforeTests(done) {
      createUserFounder(createCommunity.bind(null, addTopic.bind(null, addOpinion.bind(null, done))));
    });

    function createUserFounder(callback) {
      testUtils.withTokenOf(founderEmail, function(gotToken1) {
        founderToken = gotToken1;
        callback();
      });
    }

    function createCommunity(callback) {
      testUtils.addCommunity(founderToken, {
        community: {name: communityName, commentLength: 3},
        founder: {name: founderName}
      }, function(data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }

    function addTopic(callback) {
      testUtils.addTopic(founderToken, communityId, {
        topic: {content: topicContent}
      }, function(data) {
        topicId = data.topic.id;
        callback();
      });
    }

    function addOpinion(callback) {
      testUtils.addOpinion(founderToken, topicId, {
        opinion: {content: opinionContent}
      }, function(data) {
        opinionId = data.opinion.id;
        callback();
      });
    }

    describe('PUT /opinion/[opinionId]/comments', function addOpinionComment() {
      it('fail to add opinion because content is too long', function addingTooLongOpinion(done) {
        var content = 'content is too long';

        function onFailedToAddComment(data) {
          assert.equal(data.message, 'too-long', 'got a too-long error message');
          assert.equal(data.details.value, content, 'content is as expected');
          done();
        }

        testUtils.REST()
          .put('/opinion/' + opinionId + '/comments')
          .set('authorization', founderToken)
          .send({comment: {content: content}})
          .expect(406)
          .end(testUtils.parseResponse.bind(null, onFailedToAddComment));
      });

      it('successfully add a comment', function addComment(done) {
        function onCommentAdded(data) {
          assert.equal(data.comment.content, commentContent1, 'content is as expected');
          assert.equal(data.parent.comments, 1, 'opinion has one comment');
          commentId = data.comment.id;
          done();
        }

        testUtils.REST()
          .put('/opinion/' + opinionId + '/comments')
          .set('authorization', founderToken)
          .send({comment: {content: commentContent1}})
          .expect(200)
          .end(testUtils.parseResponse.bind(null, onCommentAdded));
      });
    });
    describe('GET /opinion/[opinionId]/comments', function listOpinionComments() {
      it('successfully get the comment list', function gotComments(done) {
        function gotComments(data) {
          assert.equal(data.comments.length, 1, 'comment list has 1 comment');
          var comment = data.comments[0];
          assert.equal(data.authors[comment.authorId].name, founderName, 'author name is as expected');
          done();
        }

        testUtils.REST()
          .get('/opinion/' + opinionId + '/comments')
          .expect(200)
          .end(testUtils.parseResponse.bind(null, gotComments));
      });
    });
    describe('POST /comment', function updateComment() {
      it('successfully update a comment', function updateComment(done) {
        function onCommentUpdated(data) {
          assert.equal(data.comment.content, commentContent2, 'content is as expected');
          done();
        }

        testUtils.REST()
          .post('/comment/')
          .set('authorization', founderToken)
          .send({comment: {id: commentId, content: commentContent2}})
          .expect(200)
          .end(testUtils.parseResponse.bind(null, onCommentUpdated));
      });
    });
    describe('GET /comment/[commentId]', function getComment() {
      it('successfully get an comment', function getOneComment(done) {
        function onGotComment(data) {
          assert.equal(data.comment.content, commentContent2, 'content is as expected');
          done();
        }

        testUtils.REST()
          .get('/comment/' + commentId)
          .expect(200)
          .end(testUtils.parseResponse.bind(null, onGotComment));
      });
    });
    describe('POST /comment/[commentId]', function updateComment2() {
      it('successfully update a comment #2', function updateOneComment2(done) {
        function onCommentUpdated(data) {
          assert.equal(data.comment.content, commentContent3, 'content is as expected');
          done();
        }

        testUtils.REST()
          .post('/comment/' + commentId)
          .set('authorization', founderToken)
          .send({comment: {content: commentContent3}})
          .expect(200)
          .end(testUtils.parseResponse.bind(null, onCommentUpdated));
      });
    });
    describe('PUT /comment/[commentId]/comments', function addSubComment() {
      it('successfully add a comment', function addSubComment(done) {
        function onSubCommentAdded(data) {
          assert.equal(data.comment.content, subCommentContent, 'content is as expected');
          assert.equal ( data.parent.comments, 1, 'comment has one sub-comment');
          subCommentId = data.comment.id;
          done();
        }

        testUtils.REST()
          .put('/comment/'+commentId+'/comments')
          .set('authorization', founderToken)
          .send({ comment : { content: subCommentContent }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onSubCommentAdded));
      });
    });
    describe('GET /comment/[commentId]/comments', function listSubComments () {
      it ('successfully get the comment list', function gotComments(done) {
        function gotSubComments (data) {
          assert.equal ( data.comments.length,1, 'comment list has 1 comment');
          var comment = data.comments[0];
          assert.equal ( comment.content, subCommentContent, 'sub comment content is as expected');
          assert.equal ( data.authors[comment.authorId].name, founderName, 'author name is as expected');
          done();
        }

        testUtils.REST()
          .get('/comment/'+commentId+'/comments')
          .expect(200)
          .end(testUtils.parseResponse.bind (null, gotSubComments));
      });
    });
    describe('DELETE /comment/[commentId]]', function archiveComment () {
      it ('successfully archive an opinion', function archiveImmutableComment (done) {
        function archiveFailed (data) {
          assert.equal ( data.message, 'immutable', 'comment is immutable');
          done();
        }

        testUtils.REST()
          .delete('/comment/'+commentId)
          .set('authorization', founderToken)
          .expect(406)
          .end(testUtils.parseResponse.bind (null, archiveFailed));
      });
      it ('successfully archive a sub content', function archiveSubContent (done) {
        function opinionArchived (data) {
          assert.equal ( data.comment.status, 'archived', 'opinion status is archived');
          done();
        }

        testUtils.REST()
          .delete('/comment/'+subCommentId)
          .set('authorization', founderToken)
          .expect(200)
          .end(testUtils.parseResponse.bind (null, opinionArchived));
      });
    });
  });
})();
