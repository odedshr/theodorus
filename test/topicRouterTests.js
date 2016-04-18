(function topicyRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');

  var testUtils = require('../test/testUtils.js');

  describe('topicRouterTest', function topicRouterTest () {
    var founderToken, communityId, founderId;
    var testId = (new Date()).getTime();
    var founderEmail = 'founder-'+testId+'@test.suite.topic';

    var communityName = 'topic-public-'+testId;
    var founderName = 'topic-public-founder-'+testId;

    var topicId;
    var topicContent1 = 'content1';
    var topicContent2 = 'content2';
    var topicContent3 = 'content3';

    before( function beforeTests (done) {
      createUserFounder(createCommunity.bind(null, done ));
    });

    function createUserFounder (callback) {
      testUtils.withTokenOf ( founderEmail, function (gotToken1) {
        founderToken = gotToken1;
        callback();
      });
    }

    function createCommunity (callback) {
      testUtils.addCommunity ( founderToken, {
        community: { name: communityName, topicLength: -10 },
        founder: { name: founderName }
      }, function (data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }

    describe('PUT /community/[communityId]/topics', function putCommunityTopic () {
      it ('fail to add topic because content is too long', function addingTooLongTopic (done) {
        var content = 'content is too long';

        function onFailedToAddTopic (data) {
          assert.equal ( data.message, 'too-long', 'got a too-long error message');
          assert.equal ( data.details.value, content, 'content is as expected');
          done();
        }

        testUtils.REST()
          .put('/community/'+communityId+'/topics')
          .set('authorization', founderToken)
          .send({ topic : { content: content }})
          .expect(406)
          .end(testUtils.parseResponse.bind (null, onFailedToAddTopic));
      });

      it ('successfully add a topic', function addTopic(done) {
        function onMembershipAdded (data) {
          assert.equal ( data.topic.content, topicContent1, 'content is as expected');
          assert.equal ( data.community.topics, 1, 'community has one topic');
          topicId = data.topic.id;
          done();
        }

        testUtils.REST()
          .put('/community/'+communityId+'/topics')
          .set('authorization', founderToken)
          .send({ topic : { content: topicContent1 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, onMembershipAdded));
      });
    });
    describe('GET /community/[communityId]/topics', function getCommunityTopics () {
      it ('successfully get the topic list', function getTopics(done) {
        function gotTopics (data) {
          assert.equal ( data.topics.length,1, 'topic list has 1 topic');
          assert.equal ( data.authors[data.topics[0].authorId].name, founderName, 'author name is as expected');
          done();
        }

        testUtils.REST()
          .get('/community/'+communityId+'/topics')
          .expect(200)
          .end(testUtils.parseResponse.bind (null, gotTopics));

      });
    });
    describe('POST /topic', function postCommunity () {
      it ('successfully update existing topic', function updateTopic (done) {

        function topicUpdated (data) {
          assert.equal ( data.topic.content, topicContent2, 'content is updated as expected');
          assert.equal ( data.community.topics, 1, 'community has one topic');
          done();
        }

        assert.ok(topicId !== undefined, 'topicId is not undefined');
        testUtils.REST()
          .post('/topic')
          .set('authorization', founderToken)
          .send({ topic : { id: topicId, content: topicContent2 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, topicUpdated));

      });
    });
    describe('GET /topic/[topicId]', function getTopic () {
      it ('successfully update existing topic', function getSingleTopic (done) {
        function gotTopic (data) {
          assert.equal ( data.topic.content, topicContent2, 'content is updated as expected');
          assert.equal ( data.author.name, founderName, 'author name is as expected');
          done();
        }

        assert.ok(topicId !== undefined, 'topicId is not undefined');
        testUtils.REST()
          .get('/topic/'+topicId)
          .set('authorization', founderToken)
          .expect(200)
          .end(testUtils.parseResponse.bind (null, gotTopic));

      });
    });
    describe('POST /topic/[topicId]', function postTopic () {
      it ('successfully update existing topic', function updateTopic2 (done) {

        function topicUpdated (data) {
          assert.equal ( data.topic.content, topicContent3, 'content is updated as expected');
          assert.equal ( data.community.topics, 1, 'community has one topic');
          done();
        }

        assert.ok(topicId !== undefined, 'topicId is not undefined');
        testUtils.REST()
          .post('/topic/'+topicId)
          .set('authorization', founderToken)
          .send({ topic : { content: topicContent3 }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, topicUpdated));

      });
    });
    describe('DELETE /topic/[topicId]', function deleteTopic () {
      it ('successfully update existing topic', function updateTopic2 (done) {

        function topicUpdated (data) {
          assert.equal ( data.topic.status, 'archived', 'topic status is archived');
          assert.equal ( data.community.topics, 0, 'community has no topics');
          done ();
        }

        assert.ok(topicId !== undefined, 'topicId is not undefined');
        testUtils.REST()
          .delete ('/topic/'+topicId)
          .set ('authorization', founderToken)
          .expect (200)
          .end (testUtils.parseResponse.bind (null, topicUpdated));

      });
    });
  });
})();