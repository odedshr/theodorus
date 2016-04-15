(function topicyRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');

  var testUtils = require('../test/testUtils.js');

  describe('ctopicRouterTest', function topicRouterTest () {
    var founderToken, memberToken, communityId, founderId, memberId;
    var testId = (new Date()).getTime();
    var founderEmail = 'founder-'+testId+'@test.suite.topic';
    var memberEmail = 'member-'+testId+'@test.suite.topic';

    var communityName = 'membership-public-'+testId;
    var founderName = 'topic-public-founder-'+testId;
    var memberName = 'topic-public-member-'+testId;

    before( function beforeTests (done) {
      testUtils.removeTokenFileOf(founderEmail);
      testUtils.removeTokenFileOf(memberEmail);
      createUserFounder(createUserMember.bind(null,createCommunity.bind(null, joinCommunity.bind(null, done))));
    });

    after ( function afterTests () {
      testUtils.removeTokenFileOf(founderEmail);
      testUtils.removeTokenFileOf(memberEmail);
    });

    function createUserFounder (callback) {
      testUtils.withTokenOf ( founderEmail, function (gotToken1) {
        founderToken = gotToken1;
        callback();
      });
    }
    function createUserMember (callback) {
      testUtils.withTokenOf ( memberEmail, function (gotToken2) {
        memberToken = gotToken2;
        callback();
      });
    }
    function createCommunity (callback) {
      testUtils.addCommunity ( founderToken, {
        community: { name: communityName, topicLength: 10 },
        founder: { name: founderName }
      }, function (data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }
    function joinCommunity (callback) {
      testUtils.addMembership ( memberToken, communityId, {
        membership: { name: memberName }
      }, function (data) {
        memberId = data.membership.id;
        callback();
      });
    }

    describe('PUT /community/[communityId]/topics', function putCommunityTopic () {
      it ('fail to add topic because content is too long', function () {});
      it ('successfully add a topic', function () {});
    });
    describe('GET /community/[communityId]/topics', function getCommunityTopics () {});
    describe('POST /topic', function postCommunity () {});
    describe('GET /topic/[topicId]', function getTopic () {});
    describe('POST /topic/[topicId]', function postTopic () {});
    describe('DELETE /topic/[topicId]', function deletTopic () {});
  });
})();