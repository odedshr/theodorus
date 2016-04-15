(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var should = require('should');

  var testUtils = require('../test/testUtils.js');
  
  describe('communityRouterTest', function communityRouterTest () {
    var token ='';

    var email = 'router@test.suite.community';
    var communityName = 'communityName'+(new Date()).getTime();
    var communityId;

    before( function beforeAllTests (done) {
      testUtils.removeTokenFileOf(email);
      testUtils.withTokenOf(email, function (gotToken) {
        token = gotToken;
        done();
      });
    });

    after(function afterAllTests() {
      testUtils.removeTokenFileOf(email);
    });

    describe ('PUT /community', function getCommunity () {
      it ('should fail to add community with no name', function addCommunityNoNameFail (done) {
        function failedToGetName (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          var errorMessage = JSON.parse(response.text);
          assert.equal (errorMessage.message, 'missing-input', 'parameter is missing');
          assert.equal (errorMessage.details.key, 'community.name', 'missing parameter is community name');
          done();
        }
        testUtils.REST()
          .put('/community')
          .send({community: {}, founder: { name : 'founderName'}})
          .set('authorization', token)
          .expect(406)
          .end(failedToGetName);
      });

      it ('should fail to add community with no founder', function addCommunityNoFounderFail (done) {
        function failedToGetName (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          var errorMessage = JSON.parse(response.text);
          assert.equal (errorMessage.message, 'missing-input', 'parameter is missing');
          assert.equal (errorMessage.details.key, 'founder.name', 'missing parameter is community name');
          done();
        }
        testUtils.REST()
          .put('/community')
          .send({community: { name: 'communityName'} })
          .set('authorization', token)
          .expect(406)
          .end(failedToGetName);
      });

      it ('should successfully add a community', function addCommunitySuccess (done) {
        function communityAdded (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          communityId = data.community.id;
          assert.equal (data.community.name, communityName, 'community has the right name');
          assert.equal (data.community.founderId, data.founder.id, 'community has the right founder id');
          assert.equal (data.founder.name, 'founderName', 'founder has the right name');
          assert.notEqual (communityId, undefined, 'communityId is undefined');
          done();
        }
        testUtils.REST()
          .put('/community')
          .send({community: { name: communityName}, founder: { name: 'founderName'} })
          .set('authorization', token)
          .expect(200)
          .end(communityAdded);
      });

      it ('should fail to add community with existing name', function addCommunityNameExistsFail (done) {
        function communityAlreadyExists (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.equal (data.message, 'already-exists', 'error message of already exists');
          assert.equal (data.details.value.name, communityName, 'existing community name is as expected');
          done();
        }
        testUtils.REST()
          .put('/community')
          .send({community: { name: communityName}, founder: { name: 'founderName'} })
          .set('authorization', token)
          .expect(409)
          .end(communityAlreadyExists);
      });
    });

    describe ('GET /community', function getCommunityList () {
      it ('should successfully get communityList', function getCommunityListSuccess (done) {
        function gotList (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          if (response) {
            var list = JSON.parse(response.text).communities;
            assert.ok((list.length > 0), 'community list is not empty');
          }
          done();
        }

        testUtils.REST()
          .get('/community')
          .set('authorization', token)
          .expect(200)
          .end(gotList);
      });
    });

    describe ('POST /community/exists', function getCommunity () {
      it ('should successfully check if existing community exists', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(data.exists, 'community exists');
            assert.equal (data.type, 'community', 'exists.type is community');
            assert.equal (data.parameters.name, communityName, 'community name is as sent');
          }
          done();
        }

        testUtils.REST()
          .post('/community/exists')
          .set('authorization', token)
          .send({community: { name : communityName }})
          .expect(200)
          .end(communityExists);
      });

      it ('should successfully check if non-existing community exists', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(!data.exists, 'community does not exists');
            assert.ok(data.type, 'community', 'exists.type is community');
            assert.ok(data.parameters.name, communityName+'NA', 'community name is as sent');
          }
          done();
        }

        testUtils.REST()
          .post('/community/exists')
          .set('authorization', token)
          .send({community: { name : communityName+'NA' }})
          .expect(200)
          .end(communityExists);
      });

      it ('should fail if not community name provided', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          if (response) {
            var errorMessage = JSON.parse(response.text);
            assert.equal (errorMessage.message, 'missing-input', 'parameter is missing');
            assert.equal (errorMessage.details.key, 'community.name', 'missing parameter is community name');
          }
          done();
        }

        testUtils.REST()
          .post('/community/exists')
          .set('authorization', token)
          .expect(406)
          .end(communityExists);
      });
    });
    describe ('GET /community/[communityId]', function getCommunity () {

      it ('should fail if not community not found', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          if (response) {
            var errorMessage = JSON.parse(response.text);
            assert.equal (errorMessage.message, 'not-found', 'error message is not found');
            assert.equal (errorMessage.details.key, 'community', 'missing parameter is community');
          }
          done();
        }

        testUtils.REST()
          .get('/community/13/')
          .set('authorization', token)
          .expect(404)
          .end(communityExists);
      });

      it ('should successfully get community anonymously', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.equal  (error, null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.equal  (data.community.name, communityName, 'community name is as expected');
            assert.equal  (data.founder.name, 'founderName', 'founder name is as expected');
            assert.equal  (data.member, undefined, 'no current member');
          }
          done();
        }

        assert.ok (communityId !== undefined, 'communityId is undefined');
        testUtils.REST()
          .get('/community/' + communityId+'/')
          .expect(200)
          .end(communityExists);
      });

      it ('should successfully get community as member', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.equal (error, null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.equal (data.founder.id, data.membership.id, 'current member is founder');
          }
          done();
        }

        testUtils.REST()
          .get('/community/' + communityId+'/')
          .set('authorization', token)
          .expect(200)
          .end(communityExists);
      });
    });

    describe ('POST /community/[communityId]', function updateCommunity () {
      it ('should successfully update community description', function postCommunity (done) {
        function communityUpdated (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(data.community.description === 'my description', 'description is updated');
          }
          done();
        }

        testUtils.REST()
          .post('/community/' + communityId+'/')
          .set('authorization', token)
          .send({ community: { description: 'my description'}})
          .expect(200)
          .end(communityUpdated);
      });
    });

    describe ('DELETE /community/[communityId]', function getCommunity () {
       //TODO: fail to delete community if more than one member
       //TODO: fail to delete community if member != current user
      it ('should successfully delete community as member', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(data.community.status === 'archived', 'community status is archived');
          }
          done();
        }

        testUtils.REST()
          .delete('/community/' + communityId+'/')
          .set('authorization', token)
          .expect(200)
          .end(communityExists);
      });
    });
  });
})();