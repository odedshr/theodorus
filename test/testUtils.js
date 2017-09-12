(function TestutilsEnclosure() {
  'use strict';

  var fs = require('fs'),
      helpers = '../src/backend/helpers/',
      config = require(helpers + 'config.js'),
      request = require('./mockRequest.js'),
      url = config('testsURL'),
      storedFilesFolder = '../' + config('storedFilesFolder') + '/';

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
    if (!fs.existsSync(tokenFile.substr(1))) {
      throw 'tokenFile not found ' + tokenFile;
    }

    (REST()).get('/api/user/connect/' + require(tokenFile).text)
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
      (REST()).post('/api/user/connect').send({ email: email, subject: 'test' })
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
    (REST()).put('/api/community').send(input).set('authorization', token)
            .end(parseResponse.bind(null, callback));
  }

  module.exports.addCommunity = addCommunity;

  function getCommunities(callback) {
    (REST()).get('/api/community/').end(parseResponse.bind(null, callback));
  }

  module.exports.getCommunities = getCommunities;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addMembership(token, communityId, membership, callback) {
    (REST()).put('/api/community/' + communityId + '/membership')
            .set('authorization', token)
      .send(membership).end(parseResponse.bind(null, callback));
  }

  module.exports.addMembership = addMembership;

  function getMemberships(token, callback) {
    (REST()).get('/api/membership/').set('authorization', token)
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

  module.exports.addPost = addPost;

  function getPosts(url, callback) {
    (REST()).get(url).end(parseResponse.bind(null, callback));
  }

  function addTopic(token, communityId, topic, callback) {
    addPost('/api/community/' + communityId + '/posts', token, topic, callback);
  }

  module.exports.addTopic = addTopic;

  function getTopics(communityId, callback) {
    getPosts('/api/community/' + communityId + '/posts', callback);
  }

  module.exports.getTopics = getTopics;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addOpinion(token, topicId, opinion, callback) {
    addPost('/api/post/' + topicId + '/posts', token, opinion, callback);
  }

  module.exports.addOpinion = addOpinion;

  function getOpinions(topicId, callback) {
    getPosts('/api/post/' + topicId + '/posts', callback);
  }

  module.exports.getOpinions = getOpinions;

  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function addComment(token, opinionId, comment, callback) {
    addPost('/api/post/' + opinionId + '/posts', token, comment, callback);
  }

  module.exports.addComment = addComment;

  function getComments(opinionId, callback) {
    getPosts('/api/post/' + opinionId + '/posts', callback);
  }

  module.exports.getComments = getComments;

  function addSubComment(token, commentId, subComment, callback) {
    addPost('/api/post/' + commentId + '/posts', token, subComment, callback);
  }

  module.exports.addSubComment = addSubComment;

  function getSubComments(commentId, callback) {
    getPosts('/api/post/' + commentId + '/posts', callback);
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
