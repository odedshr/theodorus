(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var fs = require('fs');
  var md5 = require('md5');
  var request = require('supertest');
  var should = require('should');
  var winston = require('winston');

  var config = require('../helpers/config.js');
  var db = require('../helpers/db.js');

  var url = config('testsURL');

  describe('communityRouterTest', function communityRouterTest () {
    var email = 'router@test.suite.community';
    var tokenFile = '../user-files/debug_'+email+'.json';
    var token ='';

    var communityName = 'communityName'+(new Date()).getTime();
    var communityId;

    function setToken (done, err, response) {
      if (err) {
        throw err;
      } else {
        token =  JSON.parse (response.text).token;
      }
      done();
    }
    function connect (done) {
      var connectToken = require(tokenFile).text;
      request(url).get('/user/connect/'+connectToken).end(setToken.bind(null, done));
    }

    before( function (done) {
      if (!fs.existsSync(tokenFile)) {
        request(url).post('/user/connect').send({email: email}).end(connect.bind(null, done));
      } else {
        connect(done);
      }
    });

    describe ('PUT /community', function getCommunity () {
      it ('should fail to add community with no name', function addCommunityNoNameFail (done) {
        function failedToGetName (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          var errorMessage = JSON.parse(response.text);
          assert.ok(errorMessage.message === 'missing-input', 'parameter is missing');
          assert.ok(errorMessage.details.key === 'community.name', 'missing parameter is community name');
          done();
        }
        request(url)
          .put('/community')
          .send({community: {}, founder: { name : 'founderName'}})
          .set('authorization', token)
          .expect(406)
          .end(failedToGetName);
      });

      it ('should fail to add community with no founder', function addCommunityNoFounderFail (done) {
        function failedToGetName (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          var errorMessage = JSON.parse(response.text);
          assert.ok(errorMessage.message === 'missing-input', 'parameter is missing');
          assert.ok(errorMessage.details.key === 'founder.name', 'missing parameter is community name');
          done();
        }
        request(url)
          .put('/community')
          .send({community: { name: 'communityName'} })
          .set('authorization', token)
          .expect(406)
          .end(failedToGetName);
      });

      it ('should successfully add a community', function addCommunitySuccess (done) {
        function communityAdded (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          communityId = data.community.id;
          assert.ok(data.community.name === communityName, 'community has the right name');
          assert.ok(data.community.founderId === data.founder.id, 'community has the right founder id');
          assert.ok(data.founder.name === 'founderName', 'founder has the right name');
          assert.ok (communityId !== undefined, 'communityId is undefined');
          done();
        }
        request(url)
          .put('/community')
          .send({community: { name: communityName}, founder: { name: 'founderName'} })
          .set('authorization', token)
          .expect(200)
          .end(communityAdded);
      });

      it ('should fail to add community with existing name', function addCommunityNameExistsFail (done) {
        function communityAlreadyExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          var data = JSON.parse(response.text);
          assert.ok(data.message === 'already-exists', 'error message of already exists');
          assert.ok(data.details.value.name === communityName, 'existing community name is as expected');
          done();
        }
        request(url)
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
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var list = JSON.parse(response.text).communities;
            assert.ok((list.length > 0), 'community list is not empty');
          }
          done();
        }

        request(url)
          .get('/community')
          .set('authorization', token)
          .expect(200)
          .end(gotList);
      });
    });

    describe ('POST /community/exists', function getCommunity () {
      it ('should successfully check if existing community exists', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(data.exists, 'community exists');
            assert.ok(data.type === 'community', 'exists.type is community');
            assert.ok(data.parameters.name === communityName, 'community name is as sent');
          }
          done();
        }

        request(url)
          .post('/community/exists')
          .set('authorization', token)
          .send({community: { name : communityName }})
          .expect(200)
          .end(communityExists);
      });

      it ('should successfully check if non-existing community exists', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(!data.exists, 'community does not exists');
            assert.ok(data.type === 'community', 'exists.type is community');
            assert.ok(data.parameters.name === communityName+'NA', 'community name is as sent');
          }
          done();
        }

        request(url)
          .post('/community/exists')
          .set('authorization', token)
          .send({community: { name : communityName+'NA' }})
          .expect(200)
          .end(communityExists);
      });

      it ('should fail if not community name provided', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var errorMessage = JSON.parse(response.text);
            assert.ok(errorMessage.message === 'missing-input', 'parameter is missing');
            assert.ok(errorMessage.details.key === 'community.name', 'missing parameter is community name');
          }
          done();
        }

        request(url)
          .post('/community/exists')
          .set('authorization', token)
          .expect(406)
          .end(communityExists);
      });
    });
    describe ('GET /community/[communityId]', function getCommunity () {

      it ('should fail if not community not found', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var errorMessage = JSON.parse(response.text);
            assert.ok(errorMessage.message === 'not-found', 'error message is not found');
            assert.ok(errorMessage.details.key === 'community', 'missing parameter is community');
          }
          done();
        }

        request(url)
          .get('/community/13/')
          .set('authorization', token)
          .expect(404)
          .end(communityExists);
      });

      it ('should successfully get community anonymously', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok (error === null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok (data.community.name === communityName, 'community name is as expected');
            assert.ok (data.founder.name === 'founderName', 'founder name is as expected');
            assert.ok (data.member === undefined, 'no current member');
          }
          done();
        }

        assert.ok (communityId !== undefined, 'communityId is undefined');
        request(url)
          .get('/community/' + communityId+'/')
          .expect(200)
          .end(communityExists);
      });

      it ('should successfully get community as member', function getCommunityListSuccess (done) {
        function communityExists (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var data = JSON.parse(response.text);
            assert.ok(data.founder.id === data.membership.id, 'current member is founder');
          }
          done();
        }

        request(url)
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

        request(url)
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

        request(url)
          .delete('/community/' + communityId+'/')
          .set('authorization', token)
          .expect(200)
          .end(communityExists);
      });
    });
  });
})();