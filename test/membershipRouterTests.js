(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');

  var testUtils = require('../test/testUtils.js');

  describe('membershipRouter', function () {
    var founderToken, memberToken, communityId, founderId, memberId;
    var testId = (new Date()).getTime();
    var founderEmail = 'founder-'+testId+'@test.suite.membership';
    var memberEmail = 'member-'+testId+'@test.suite.membership';

    var communityName = 'membership-public-'+testId;
    var founderName = 'membership-public-founder-'+testId;
    var memberName = 'membership-public-member-'+testId;

    before( function beforeTests (done) {
      createUserFounder(createUserMember.bind(null,createCommunity.bind(null, done)));
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
        community: { name: communityName },
        founder: { name: founderName }
      }, function (data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }

    describe('POST /membership/exists/', function () {
      it ('check for existing name', function checkExistingName (done) {
        function onCheckExistingName (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.exists, true, 'name exists as it should');
          assert.equal (data.type, 'membership', 'name exists as it should');
          assert.equal (data.parameters.name, founderName, 'name is as sent');
          done();
        }

        testUtils.REST()
          .post  ('/membership/exists')
          .set('authorization', memberToken)
          .send ({membership : { communityId: communityId, name: founderName}})
          .expect(200)
          .end(onCheckExistingName);
      });

      it ('check for non-existing name', function checkNonExistingName (done) {
        function onCheckNonExistingName (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.exists, false, 'name exists as it should');
          assert.equal (data.type, 'membership', 'name exists as it should');
          assert.equal (data.parameters.name, memberName, 'name is as sent');
          done();
        }

        testUtils.REST()
          .post ('/membership/exists')
          .set ('authorization', memberToken)
          .send ({ membership : { communityId: communityId, name: memberName}})
          .expect(200)
          .end(onCheckNonExistingName);
      });
      it ('check for empty string', function checkEmptyString (done) {
        function onCheckEmptyName (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.message, 'too-short', 'parameter is missing error');
          assert.equal (data.details.key, 'membership.name', 'missing parameter is membership.name');
          done();
        }

        testUtils.REST()
          .post ('/membership/exists')
          .set ('authorization', memberToken)
          .send ({ membership : { communityId: communityId, name: ''}})
          .expect(406)
          .end(onCheckEmptyName);
      });
    });

    describe('PUT /community/[communityId]/membership', function () {
      it ('should fail to add member with no name', function failToAddNoName (done) {
        function onAddMemberWithNoName (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.message, 'missing-input', 'parameter is missing error');
          assert.equal (data.details.key, 'membership.name', 'missing parameter is membership.name');
          done();
        }

        testUtils.REST()
          .put('/community/'+communityId+'/membership')
          .set('authorization', memberToken)
          .send({membership : {}})
          .expect(406)
          .end(onAddMemberWithNoName);
      });
      it ('should fail to add member with existing name', function failToAddExistingName (done) {
        function onMembershipAdded (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.message, 'already-exists', 'membership already exists');
          assert.equal (data.details.key, 'membership.name', 'erroneous parameter is membership.name');
          done();
        }

        testUtils.REST()
          .put('/community/'+communityId+'/membership')
          .set('authorization', memberToken )
          .send({membership : { name: founderName }})
          .expect(409)
          .end(onMembershipAdded);
      });
      it ('successfully add member', function addMember (done) {
        function onMembershipAdded (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.membership.name, memberName, 'membership name is as expected');
          memberId = data.membership.id;
          done();
        }

        testUtils.REST()
          .put('/community/'+communityId+'/membership')
          .set('authorization', memberToken)
          .send({membership : { name: memberName}})
          .expect(200)
          .end(onMembershipAdded);
      });
    });
    describe('GET /community/[communityId]/membership', function () {
      it ('should get community members list', function getCommunityMemberList (done) {
        function onAuthTokenGenerated (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal ( data.membersLength, 2, 'community has members');
          assert.equal ( data.members[0].name, 'membership-public-founder-'+testId, 'member name is as expected');
          done();
        }

        testUtils.REST()
          .get('/community/'+communityId+'/membership')
          .expect(200)
          .end(onAuthTokenGenerated);
      });
      //TODO failed to get list of secret community
    });

    describe('GET /membership', function () {
      it ('should get user membership list', function getUserMemberList (done) {
        function onLeftCommunity (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.memberships.length, 1, 'user has a single membership');
          assert.equal (data.memberships[0].name, founderName, 'membership name is as expected');
          assert.equal (data.communities[data.memberships[0].communityId].name, communityName, 'community name is as expected');
          done();
        }

        testUtils.REST()
          .get('/membership')
          .set('authorization', founderToken)
          .expect(200)
          .end(onLeftCommunity);
      });
    });

    describe('GET /membership/[membershipId]/', function () {
      it ('should get self-member details', function getSelfMemberDetails (done) {
        function onGetSelfMembership (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal ( data.membershipSize, 20, 'membership has the right number of properties');
          assert.equal ( data.membership.name, founderName, 'membership name is as expected');
          done();
        }

        testUtils.REST()
          .get('/membership/'+founderId)
          .set('authorization', founderToken)
          .expect(200)
          .end(onGetSelfMembership);
      });
      it ('should get member details', function getMemberDetails (done) {
        function onGetMembership (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal ( data.membershipSize, 10, 'membership has the right number of properties');
          done();
        }

        testUtils.REST()
          .get('/membership/'+founderId)
          .expect(200)
          .end(onGetMembership);
      });
    });
    describe('POST /membership/[membershipId]/', function () {
      it ('should update member name', function updateMemberName (done) {
        var updatedName = 'updated-name-' + testId;

        function callback (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal ( data.membership.name, updatedName, 'member name was updated');
          done();
        }

        testUtils.REST()
          .post('/membership/' + memberId)
          .send({ membership: {name: updatedName}})
          .set('authorization', memberToken)
          .expect(200)
          .end(callback);
      });
      it ('should fail to set member name to existing', function failUseExistingName (done) {
        function callback (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal ( data.message, 'already-exists', 'failed to update with already-exists error');
          assert.equal ( data.details.key, 'membership.name', 'member name is the faulty parameter');
          done();
        }

        testUtils.REST()
          .post('/membership/' + memberId)
          .send({ membership: {name: founderName}})
          .set('authorization', memberToken)
          .expect(409)
          .end(callback);
      });
      it ('should fail to update status', function failUpdateStatus (done) {
        function callback (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal ( data.membership.status, 'active', 'status remains as it was');
          assert.equal ( data.membership.name, memberName, 'member.name has updated');
          done();
        }

        testUtils.REST()
          .post('/membership/' + memberId)
          .send({ membership: {status: 'archived', name: memberName }})
          .set('authorization', memberToken)
          .expect(200)
          .end(callback);

      });
    });

    describe('GET /community/[communityId]/quit', function () {
      it ('successfully remove membership', function removeMembership (done) {
        function onLeftCommunity (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.membership.status, 'archived', 'membership is archived');
          done();
        }

        testUtils.REST()
          .get('/community/'+communityId+'/quit')
          .set('authorization', memberToken)
          .expect(200)
          .end(onLeftCommunity);
      });
    });

    describe('DELETE /membership/[membershipId]/', function () {
      it ('fail to delete if not user', function failToDelete (done) {
        function onLeftCommunity (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.message, 'no-permissions', 'got a no-permissions message');
          assert.equal (data.details.action, 'remove-member', 'action is remove-member');
          done();
        }

        testUtils.REST()
          .delete('/membership/'+founderId)
          .set('authorization', memberToken)
          .expect(401)
          .end(onLeftCommunity);
      });
      it ('quit community', function quitCommunity (done) {
        function onLeftCommunity (error,response) {
          assert.equal ( error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.membership.status, 'archived', 'membership is now archived');
          done();
        }

        testUtils.REST()
          .delete('/membership/'+founderId)
          .set('authorization', founderToken)
          .expect(200)
          .end(onLeftCommunity);
      });
    });

  });
})();