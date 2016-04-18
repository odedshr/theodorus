(function opinionRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');

  var testUtils = require('../test/testUtils.js');

describe('opinionRouterRouter', function () {
  var founderToken, communityId, founderId;
  var testId = (new Date()).getTime();
  var founderEmail = 'founder-'+testId+'@test.suite.opinion';

  var communityName = 'opinion-public-'+testId;
  var founderName = 'opinion-public-founder-'+testId;

  var topicId;
  var opinionId;
  var topicContent = 'topic1';
  var opinionContent1 = 'content1';
  var opinionContent2 = 'content2';
  var opinionContent3 = 'content3';
  var opinionContent4 = 'content4';

    before( function beforeTests (done) {
      createUserFounder(createCommunity.bind(null, addTopic.bind(null, done )));
    });

    function createUserFounder (callback) {
      testUtils.withTokenOf ( founderEmail, function (gotToken1) {
        founderToken = gotToken1;
        callback();
      });
    }

    function createCommunity (callback) {
      testUtils.addCommunity ( founderToken, {
        community: { name: communityName, opinionLength: -10 },
        founder: { name: founderName }
      }, function (data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }

      function addTopic (callback) {
        testUtils.addTopic ( founderToken, communityId, {
          topic: { content: topicContent}
        }, function (data) {
          topicId = data.topic.id;
          callback();
        });
      }

    describe('PUT /topic/[topicId]/opinions', function () {
      it ('fail to add opinion because content is too long', function addingTooLongOpinion (done) {
        var content = 'content is too long';

        function onFailedToAddOpinion (data) {
          assert.equal ( data.message, 'too-long', 'got a too-long error message');
          assert.equal ( data.details.value, content, 'content is as expected');
          done();
        }

        testUtils.REST()
          .put('/topic/'+topicId+'/opinions')
          .set('authorization', founderToken)
          .send({ opinion : { content: content }})
          .expect(406)
          .end(testUtils.parseResponse.bind (null, onFailedToAddOpinion));
      });

      it ('successfully add a topic', function addTopic(done) {
        function onOpinionAdded (data) {
          assert.equal ( data.opinion.content, opinionContent1, 'content is as expected');
          assert.equal ( data.topic.opinions, 1, 'topic has one opinion');
          done();
        }

        testUtils.REST()
          .put('/topic/'+topicId+'/opinions')
          .set('authorization', founderToken)
          .send({ opinion : { content: opinionContent1 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onOpinionAdded));
      });

      it ('successfully update a opinion #1', function addTopic(done) {
        function onOpinionAdded (data) {
          assert.equal ( data.opinion.content, opinionContent2, 'content is as expected');
          assert.equal ( data.topic.opinions, 1, 'topic has one opinion');
          assert.equal ( data.history[0].content, opinionContent1, 'history content is as expected');
          opinionId = data.opinion.id;
          done();
        }

        testUtils.REST()
          .put('/topic/'+topicId+'/opinions')
          .set('authorization', founderToken)
          .send({ opinion : { content: opinionContent2 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onOpinionAdded));
      });
    });
    describe('GET /topic/[topicId]/opinions', function getOpinionList() {
      it ('successfully get the opinion list', function getOpinions(done) {
        function gotOpinions (data) {
          assert.equal ( data.opinions.length,1, 'topic list has 1 topic');
          var opinion = data.opinions[0];
          assert.equal ( data.authors[opinion.authorId].name, founderName, 'author name is as expected');
          assert.equal ( data.history[opinion.authorId][0].content, opinionContent1, 'history content is as expected');
          done();
        }

        testUtils.REST()
          .get('/topic/'+topicId+'/opinions')
          .expect(200)
          .end(testUtils.parseResponse.bind (null, gotOpinions));
      });
    });
    describe('POST /opinion', function () {
      it ('successfully update a opinoin #2', function updateOpinion2(done) {
        function onOpinionUpdated (data) {
          assert.equal ( data.opinion.content, opinionContent3, 'content is as expected');
          assert.equal ( data.history.length, 2, 'opinion has 2 history elements');
          assert.equal ( data.history[0].content, opinionContent1, 'history content is as expected');
          opinionId = data.opinion.id;
          done();
        }

        testUtils.REST()
          .post('/opinion/')
          .set('authorization', founderToken)
          .send({ opinion : { id: opinionId, content: opinionContent3 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onOpinionUpdated));
      });
    });
    describe('GET /opinion/[opinionId]', function getOpinion () {
      it ('successfully get an opinion', function getOneOpinion (done) {
        function onGotOpinion (data) {
          assert.equal ( data.opinion.content, opinionContent3, 'content is as expected');
          assert.equal ( data.history.length, 2, 'opinion has 2 history elements');
          assert.equal ( data.history[0].content, opinionContent1, 'history content is as expected');
          opinionId = data.opinion.id;
          done();
        }

        testUtils.REST()
          .get('/opinion/'+opinionId)
          .send({ opinion : { content: opinionContent3 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onGotOpinion));
      });
    });
    describe('POST /opinion/[opinionId]', function () {
      it ('successfully update a opinoin #3', function updateOpinion3 (done) {
        function onOpinionUpdated (data) {
          assert.equal ( data.opinion.content, opinionContent4, 'content is as expected');
          assert.equal ( data.history.length, 3, 'opinion has 2 history elements');
          assert.equal ( data.history[0].content, opinionContent1, 'history content is as expected');
          opinionId = data.opinion.id;
          done();
        }

        testUtils.REST()
          .post('/opinion/'+opinionId)
          .set('authorization', founderToken)
          .send({ opinion : { content: opinionContent4 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onOpinionUpdated));
      });
    });
    describe('DELETE /opinion/[opinionId]', function () {
      it ('successfully archive an opinion', function archiveOpinion (done) {
        function opinionArchived (data) {
          assert.equal ( data.opinion.status, 'archived', 'opinion status is archived');
          done();
        }

        testUtils.REST()
          .delete('/opinion/'+opinionId)
          .set('authorization', founderToken)
          .expect(200)
          .end(testUtils.parseResponse.bind (null, opinionArchived));
      });
    });
  });
})();