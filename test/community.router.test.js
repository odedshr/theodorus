/* global describe, before */
(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert'),
      testUtils = require('./testUtils.js');

  describe('communityRouterTest', function communityRouterTest() {
    var token = '',
        email = 'router@test.suite.community',
        communityName = 'communityName' + (new Date()).getTime(),
        tag1 = testUtils.getRandomTag(),
        tag2 = testUtils.getRandomTag(),
        communityDescription = 'a community #' + tag1 + ' #' + tag2,
        communityDescription2 = 'a community #' + tag1,
        communityId;

    before(function beforeAllTests(done) {
      testUtils.removeTokenFileOf(email);
      testUtils.withTokenOf(email, function(gotToken) {
        token = gotToken;
        done();
      });
    });

    describe('PUT /community', function getCommunity() {
      it('should fail to add community with no name', function addCommunityNoNameFail(done) {
        function failedToGetName(error, response) {
          var errorMessage;

          assert.equal(error, null, 'no errors requesting token');
          errorMessage = JSON.parse(response.text);

          assert.equal(errorMessage.message, 'missing-input', 'parameter is missing');
          assert.equal(errorMessage.details.key, 'community.name', 'missing parameter is community name');
          done();
        }

        testUtils.REST()
          .put('/api/community')
          .send({ community: {}, founder: { alias: 'founderAlias' } })
          .set('authorization', token)
          .expect(406)
          .end(failedToGetName);
      });

      it('should fail to add community with no founder', function addCommunityNoFounderFail(done) {
        function failedToGetName(error, response) {
          var errorMessage;

          assert.equal(error, null, 'no errors requesting token');
          errorMessage = JSON.parse(response.text);

          assert.equal(errorMessage.message, 'missing-input', 'parameter is missing');
          assert.equal(errorMessage.details.key, 'founder', 'missing parameter is founder');
          done();
        }

        testUtils.REST()
          .put('/api/community')
          .send({ community: { name: 'communityName' } })
          .set('authorization', token)
          .expect(406)
          .end(failedToGetName);
      });

      it('should successfully add a community', function addCommunitySuccess(done) {
        function communityAdded(data) {
          communityId = data.community.id;
          assert.equal(data.community.name, communityName, 'community has the right name');
          assert.equal(data.community.founderId, data.founder.id, 'community has the right founder id');
          assert.equal(data.founder.alias, 'founderAlias', 'founder has the right alias');
          assert.notEqual(communityId, undefined, 'communityId is undefined');
          done();
        }

        testUtils.REST()
          .put('/api/community')
          .send({ community: { name: communityName,
                              description: communityDescription },
                  founder: { alias: 'founderAlias' } })
          .set('authorization', token)
          .expect(200)
          .end(testUtils.parseResponse.bind(null, communityAdded));
      });

      it('should fail to add community with existing name', function addCommunityNameExistsFail(done) {
        function communityAlreadyExists(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');
          data = JSON.parse(response.text);

          assert.equal(data.message, 'already-exists', 'error message of already exists');
          assert.equal(data.details.value.name, communityName, 'existing community name is as expected');
          done();
        }

        testUtils.REST()
          .put('/api/community')
          .send({ community: { name: communityName }, founder: { alias: 'founderAlias' } })
          .set('authorization', token)
          .expect(409)
          .end(communityAlreadyExists);
      });
    });

    describe('GET /community', function getCommunityList() {
      it('should successfully get communityList', function getCommunityListSuccess(done) {
        function gotList(error, response) {
          var list;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            list = JSON.parse(response.text).communities;

            assert.ok((list.length > 0), 'community list is not empty');
          }

          done();
        }

        testUtils.REST()
          .get('/api/community')
          .set('authorization', token)
          .expect(200)
          .end(gotList);
      });
    });

    describe('POST /community/exists', function getCommunity() {
      it('should successfully check if existing community exists', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            data = JSON.parse(response.text);

            assert.ok(data.exists, 'community exists');
            assert.equal(data.type, 'community', 'exists.type is community');
            assert.equal(data.parameters.name, communityName, 'community name is as sent');
          }

          done();
        }

        testUtils.REST()
          .post('/api/community/exists')
          .set('authorization', token)
          .send({ community: { name: communityName } })
          .expect(200)
          .end(communityExists);
      });

      it('should successfully check if non-existing community exists', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            data = JSON.parse(response.text);

            assert.ok(!data.exists, 'community does not exists');
            assert.ok(data.type, 'community', 'exists.type is community');
            assert.ok(data.parameters.name, communityName + 'NA', 'community name is as sent');
          }

          done();
        }

        testUtils.REST()
          .post('/api/community/exists')
          .set('authorization', token)
          .send({ community: { name: communityName + 'NA' } })
          .expect(200)
          .end(communityExists);
      });

      it('should fail if not community name provided', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var errorMessage;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            errorMessage = JSON.parse(response.text);

            assert.equal(errorMessage.message, 'missing-input', 'parameter is missing');
            assert.equal(errorMessage.details.key, 'community.name', 'missing parameter is community name');
          }

          done();
        }

        testUtils.REST()
          .post('/api/community/exists')
          .set('authorization', token)
          .expect(406)
          .end(communityExists);
      });
    });
    describe('GET /community/[communityId]', function getCommunity() {

      it('should fail if not community not found', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var errorMessage;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            errorMessage = JSON.parse(response.text);

            assert.equal(errorMessage.message, 'not-found', 'error message is not found');
            assert.equal(errorMessage.details.key, 'community', 'missing parameter is community');
          }

          done();
        }

        testUtils.REST()
          .get('/api/community/13/')
          .set('authorization', token)
          .expect(404)
          .end(communityExists);
      });

      it('should successfully get community anonymously', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            data = JSON.parse(response.text);

            assert.equal(data.community.name, communityName, 'community name is as expected');
            assert.equal(data.founder.alias, 'founderAlias', 'founder name is as expected');
            assert.equal(data.member, undefined, 'no current member');
          }

          done();
        }

        assert.ok(communityId !== undefined, 'communityId is undefined');
        testUtils.REST()
          .get('/api/community/' + communityId + '/')
          .expect(200)
          .end(communityExists);
      });

      it('should successfully get community as member', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var data;

          assert.equal(error, null, 'no errors requesting token');

          if (response) {
            data = JSON.parse(response.text);

            assert.equal(data.founder.id, data.membership.id, 'current member is founder');
          }

          done();
        }

        testUtils.REST()
          .get('/api/community/' + communityId + '/')
          .set('authorization', token)
          .expect(200)
          .end(communityExists);
      });
    });

    describe('POST /community/[communityId]', function updateCommunity() {
      it('should successfully update community description', function postCommunity(done) {
        function communityUpdated(error, response) {
          var data;

          assert.ok(error === null, 'no errors requesting token');

          if (response) {
            data = JSON.parse(response.text);

            assert.ok(data.community.description === communityDescription2, 'description is updated');
          }

          done();
        }

        testUtils.REST()
          .post('/api/community/' + communityId + '/')
          .set('authorization', token)
          .send({ community: { description: communityDescription2 } })
          .expect(200)
          .end(communityUpdated);
      });
    });

    describe('GET /community/tag/', function getCommunityTags() {
      it('should successfully get tagged communityList', function getTaggedCommunityListSuccess(done) {
        function gotTaggedList(data) {
          assert.ok((data.communities.length > 0), 'community list is not empty');
          assert.ok((data.tags[data.communities[0].id][0] === tag1), 'tag is as expected');
          assert.ok((data.tags[data.communities[0].id].length === 1), 'community has 1 tag as expected');
          done();
        }

        testUtils.REST()
          .get('/api/community/tag/' + tag1)
          .set('authorization', token)
          .expect(200)
          .end(testUtils.parseResponse.bind(null, gotTaggedList));
      });
    });

    describe('DELETE /community/[communityId]', function getCommunity() {
      //TODO: fail to delete community if more than one member
      //TODO: fail to delete community if member != current user
      it('should successfully delete community as member', function getCommunityListSuccess(done) {
        function communityExists(error, response) {
          var data;

          assert.ok(error === null, 'no errors requesting token');

          if (response) {
            data = JSON.parse(response.text);

            assert.ok(data.community.status === 'archived', 'community status is archived');
          }

          done();
        }

        testUtils.REST()
          .delete('/api/community/' + communityId + '/')
          .set('authorization', token)
          .expect(200)
          .end(communityExists);
      });
    });

  });
})();
