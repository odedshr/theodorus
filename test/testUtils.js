(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var fs = require('fs');
  var md5 = require('md5');
  //var request = require('supertest');
  var should = require('should');
  var winston = require('winston');

  var helpers = '../src/backend/helpers/';
  var config = require(helpers + 'config.js');

  var request = require('./mockRequest.js');

  var url = config('testsURL');
  var storedFilesFolder = '../' + config('storedFilesFolder') + '/';

  function REST() {
    return request(url);
  }

  function getTokenFile(email) {
    return storedFilesFolder + email + '-test.json';
  }

  function setToken(callback, err, response) {
    if (err) {
      throw err;
    } else {
      callback(JSON.parse(response.text).token);
    }
  }

  function removeTokenFileOf(email) {
    var filename = storedFilesFolder + email + '-test.json';

    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename);
    }
  }

  function getAuthToken(tokenFile, callback) {
    (REST()).get('/user/connect/' + require(tokenFile).text)
            .end(setToken.bind(null, callback));
    if (fs.existsSync(tokenFile.substr(1))) {
      fs.unlinkSync(tokenFile.substr(1));
    } else if (fs.existsSync(tokenFile)) {
      fs.unlinkSync(tokenFile);
    }
  }

  function sendTokenRequest(email, callback) {
    var tokenFile = getTokenFile(email);
    if (!fs.existsSync(tokenFile)) {
      (REST()).post('/user/connect').send({email: email, subject: 'test'})
              .end(getAuthToken.bind(null, tokenFile, callback));
    } else {
      getAuthToken(tokenFile, callback);
    }
  }

  function parseResponse(callback, error, response) {
    if (error !== null) {
      callback(error);
      return;
    }
    try {
      callback(response.text.length > 0 ? JSON.parse(response.text) :
                                          undefined);
    }
    catch (err) {
      throw err;
    }

  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addCommunity(token, input, callback) {
    (REST()).put('/community').send(input).set('authorization', token)
            .end(parseResponse.bind(null, callback));
  }
  module.exports.addCommunity = addCommunity;

  function getCommunities(callback) {
    (REST()).get('/community/').end(parseResponse.bind(null, callback));
  }
  module.exports.getCommunities = getCommunities;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addMembership(token, communityId, membership, callback) {
    (REST()).put('/community/' + communityId + '/membership')
            .set('authorization', token)
      .send(membership).end(parseResponse.bind(null, callback));
  }
  module.exports.addMembership = addMembership;

  function getMemberships(token, callback) {
    (REST()).get('/membership/').set('authorization', token)
            .end(parseResponse.bind(null, callback));
  }
  module.exports.getMemberships = getMemberships;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addRequest() {}
  function addInvite() {}

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addPost(url, token, post, callback) {
    (REST()).put(url).set('authorization', token).send(post)
            .end(parseResponse.bind(null, callback));
  }
  module.exports.addTopic = addTopic;

  function getPosts(url, callback) {
    (REST()).get(url).end(parseResponse.bind(null, callback));
  }

  function addTopic(token, communityId, topic, callback) {
    addPost('/community/' + communityId + '/topics', token, topic, callback);
  }
  module.exports.addTopic = addTopic;

  function getTopics(communityId, callback) {
    getPosts('/community/' + communityId + '/topics', callback);
  }
  module.exports.getTopics = getTopics;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addOpinion(token, topicId, opinion, callback) {
    addPost('/topic/' + topicId + '/opinions', token, opinion, callback);
  }
  module.exports.addOpinion = addOpinion;

  function getOpinions(topicId, callback) {
    getPosts('/topic/' + topicId + '/opinions', callback);
  }
  module.exports.getOpinions = getOpinions;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addComment(token, opinionId, comment, callback) {
    addPost('/opinion/' + opinionId + '/comments', token, comment, callback);
  }
  module.exports.addComment = addComment;

  function getComments(opinionId, callback) {
    getPosts('/opinion/' + opinionId + '/comments', callback);
  }
  module.exports.getComments = getComments;

  function addSubComment(token, commentId, subComment, callback) {
    addPost('/comment/' + commentId + '/comments', token, subComment, callback);
  }
  module.exports.addSubComment = addSubComment;

  function getSubComments(commentId, callback) {
    getPosts('/comment/' + commentId + '/comments', callback);
  }
  module.exports.getSubComments = getSubComments;
  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function getRandomTag() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  module.exports.getRandomTag = getRandomTag;

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  module.exports.REST = REST;
  module.exports.getTokenFile = getTokenFile;
  module.exports.withTokenOf = sendTokenRequest;
  module.exports.removeTokenFileOf = removeTokenFileOf;
  module.exports.parseResponse = parseResponse;

  module.exports.addRequest = addRequest;
  module.exports.addInvite = addInvite;
  module.exports.storedFilesFolder = storedFilesFolder;

})();
