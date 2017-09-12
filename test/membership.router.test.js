/* globals before */
;(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert'),
      testUtils = require('./testUtils.js');

  describe('membershipRouter', function() {
    var founderToken, memberToken, communityId, founderId, memberId,
        testId = ((new Date()).getTime() + '').substr(0, 10),
        founderEmail = 'founder-' + testId + '@test.suite.membership',
        memberEmail = 'member-' + testId + '@test.suite.membership',

        communityName = 'mp' + testId, //membership-public
        founderAlias = 'mpf' + testId, //membership-public-founder
        memberAlias = 'mpm' + testId; //membership-public-member

    before(function beforeTests(done) {
      createUserFounder(createUserMember.bind(null, createCommunity.bind(null, done)));
    });

    function createUserFounder(callback) {
      testUtils.withTokenOf(founderEmail, function(gotToken1) {
        founderToken = gotToken1;
        callback();
      });
    }

    function createUserMember(callback) {
      testUtils.withTokenOf(memberEmail, function(gotToken2) {
        memberToken = gotToken2;
        callback();
      });
    }

    function createCommunity(callback) {
      testUtils.addCommunity(founderToken, {
        community: { name: communityName },
        founder: { alias: founderAlias }
      }, function(data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }

    describe('POST /membership/exists/', function() {
      it('check for existing alias', function checkExistingName(done) {
        function onCheckExistingName(data) {
          assert.equal(data.exists, true, 'alias exists as it should');
          assert.equal(data.type, 'membership', 'alias exists as it should');
          assert.equal(data.parameters.alias, founderAlias, 'alias is as sent');
          done();
        }

        testUtils.REST()
          .post('/api/membership/exists')
          .set('authorization', memberToken)
          .send({ membership: { communityId: communityId, alias: founderAlias } })
          .expect(200)
          .end(testUtils.parseResponse.bind(this, onCheckExistingName));
      });

      it('check for non-existing alias', function checkNonExistingName(done) {
        function onCheckNonExistingName(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.exists, false, 'alias exists as it should');
          assert.equal(data.type, 'membership', 'alias exists as it should');
          assert.equal(data.parameters.alias, memberAlias, 'alias is as sent');
          done();
        }

        testUtils.REST()
          .post('/api/membership/exists')
          .set('authorization', memberToken)
          .send({ membership: { communityId: communityId, alias: memberAlias } })
          .expect(200)
          .end(onCheckNonExistingName);
      });
      it('check for empty string', function checkEmptyString(done) {
        function onCheckEmptyName(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.message, 'too-short', 'parameter is missing error');
          assert.equal(data.details.key, 'membership.alias', 'missing parameter is membership.alias');
          done();
        }

        testUtils.REST()
          .post('/api/membership/exists')
          .set('authorization', memberToken)
          .send({ membership: { communityId: communityId, alias: '' } })
          .expect(406)
          .end(onCheckEmptyName);
      });
    });

    describe('PUT /community/[communityId]/membership', function() {
      it('should fail to add member with no alias', function failToAddNoName(done) {
        function onAddMemberWithNoName(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.message, 'missing-input', 'parameter is missing error');
          assert.equal(data.details.key, 'membership.alias', 'missing parameter is membership.alias');
          done();
        }

        testUtils.REST()
          .put('/api/community/' + communityId + '/membership')
          .set('authorization', memberToken)
          .send({ membership: {} })
          .expect(406)
          .end(onAddMemberWithNoName);
      });
      it('should fail to add member with existing alias', function failToAddExistingName(done) {
        function onMembershipAdded(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.message, 'already-exists', 'membership already exists');
          assert.equal(data.details.key, 'membership.alias', 'erroneous parameter is membership.alias');
          done();
        }

        testUtils.REST()
          .put('/api/community/' + communityId + '/membership')
          .set('authorization', memberToken)
          .send({ membership: { alias: founderAlias } })
          .expect(409)
          .end(onMembershipAdded);
      });
      it('successfully add member', function addMember(done) {
        function onMembershipAdded(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membership.alias, memberAlias, 'membership name is as expected');
          memberId = data.membership.id;
          done();
        }

        testUtils.REST()
          .put('/api/community/' + communityId + '/membership')
          .set('authorization', memberToken)
          .send({ membership: { alias: memberAlias } })
          .expect(200)
          .end(onMembershipAdded);
      });
    });

    describe('GET /community/[communityId]/membership', function() {
      it('should get community members list', function getCommunityMemberList(done) {
        function onAuthTokenGenerated(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membersLength, 2, 'community has members');
          assert.equal(data.members[0].alias, founderAlias, 'member alias is as expected');
          done();
        }

        testUtils.REST()
          .get('/api/community/' + communityId + '/membership')
          .expect(200)
          .end(onAuthTokenGenerated);
      });
      //TODO failed to get list of secret community
    });

    describe('GET /membership', function() {
      it('should get user membership list', function getUserMemberList(done) {
        function onLeftCommunity(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.memberships.length, 1, 'user has a single membership');
          assert.equal(data.memberships[0].alias, founderAlias, 'membership alias is as expected');
          assert.equal(data.communities[data.memberships[0].communityId].name,
                       communityName, 'community name is as expected');
          done();
        }

        testUtils.REST()
          .get('/api/membership')
          .set('authorization', founderToken)
          .expect(200)
          .end(onLeftCommunity);
      });
    });

    describe('GET /membership/[membershipId]/', function() {
      it('should get self-member details', function getSelfMemberDetails(done) {
        function onGetSelfMembership(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membershipSize, 20, 'membership has the right number of properties');
          assert.equal(data.membership.alias, founderAlias, 'membership alias is as expected');
          done();
        }

        testUtils.REST()
          .get('/api/membership/' + founderId)
          .set('authorization', founderToken)
          .expect(200)
          .end(onGetSelfMembership);
      });
      it('should get member details', function getMemberDetails(done) {
        function onGetMembership(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membershipSize, 11, 'membership has the right number of properties');
          done();
        }

        testUtils.REST()
          .get('/api/membership/' + founderId)
          .expect(200)
          .end(onGetMembership);
      });
    });

    describe('POST /membership/[membershipId]/', function() {
      it('should update member alias', function updateMemberName(done) {
        var updatedName = 'updated-name-' + testId;

        function callback(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membership.alias, updatedName, 'member alias was updated');
          done();
        }

        testUtils.REST()
          .post('/api/membership/' + memberId)
          .send({ membership: { alias: updatedName } })
          .set('authorization', memberToken)
          .expect(200)
          .end(callback);
      });

      it('should fail setting existing alias', function failUseExistingName(done) {
        function callback(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.message, 'already-exists', 'failed to update with already-exists error');
          assert.equal(data.details.key, 'membership.alias', 'member alias is the faulty parameter');
          done();
        }

        testUtils.REST()
          .post('/api/membership/' + memberId)
          .send({ membership: { alias: founderAlias } })
          .set('authorization', memberToken)
          .expect(409)
          .end(callback);
      });
      it('should fail to update status', function failUpdateStatus(done) {
        function callback(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membership.status, 'active', 'status remains as it was');
          assert.equal(data.membership.alias, memberAlias, 'member.alias has updated');
          done();
        }

        testUtils.REST()
          .post('/api/membership/' + memberId)
          .send({ membership: { status: 'archived', alias: memberAlias } })
          .set('authorization', memberToken)
          .expect(200)
          .end(callback);

      });
    });

    describe('GET /community/[communityId]/quit', function() {
      it('successfully remove membership', function removeMembership(done) {
        function onLeftCommunity(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membership.status, 'archived', 'membership is archived');
          done();
        }

        testUtils.REST()
          .get('/api/community/' + communityId + '/quit')
          .set('authorization', memberToken)
          .expect(200)
          .end(onLeftCommunity);
      });
    });

    describe('DELETE /membership/[membershipId]/', function() {
      it('fail to delete if not user', function failToDelete(done) {
        function onLeftCommunity(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.message, 'no-permissions', 'got a no-permissions message');
          assert.equal(data.details.action, 'remove-member', 'action is remove-member');
          done();
        }

        testUtils.REST()
          .delete('/api/membership/' + founderId)
          .set('authorization', memberToken)
          .expect(401)
          .end(onLeftCommunity);
      });
      it('quit community', function quitCommunity(done) {
        function onLeftCommunity(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.membership.status, 'archived', 'membership is now archived');
          done();
        }

        testUtils.REST()
          .delete('/api/membership/' + founderId)
          .set('authorization', founderToken)
          .expect(200)
          .end(onLeftCommunity);
      });
    });

  });
})();
