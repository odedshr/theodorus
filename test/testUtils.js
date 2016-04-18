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

  function REST () {
    return request(url);
  }

  function getTokenFile (email) {
    return '../user-files/debug_'+email+'.json';
  }
  function setToken (callback, err, response) {
    if (err) {
      throw err;
    } else {
      callback(JSON.parse (response.text).token);
    }
  }

  function removeTokenFileOf (email) {
    var filename = './user-files/debug_'+email+'.json';

    if (fs.existsSync(filename)) {
      fs.unlinkSync (filename);
    } else {
      console.log('file not exists ' + filename);
    }
  }

  function getAuthToken (tokenFile, callback) {
    (REST ()).get('/user/connect/'+require(tokenFile).text).end(setToken.bind(null, callback));
    fs.unlinkSync (tokenFile.substr(1));
  }
  function sendTokenRequest (email, callback) {
    var tokenFile = getTokenFile(email);
    if (!fs.existsSync(tokenFile)) {
      (REST ()).post('/user/connect').send({email: email}).end(getAuthToken.bind(null, tokenFile, callback));
    } else {
      getAuthToken(tokenFile, callback);
    }
  }

  function parseResponse (callback, error, response) {
    if (error !== null) {
      throw error;
    }
    callback (JSON.parse(response.text));
  }

  function addCommunity (token, input, callback) {
    (REST()).put('/community').send(input).set('authorization', token).end(parseResponse.bind(null, callback));
  }
  function addMembership (token, communityId, membership, callback) {
    (REST()).put('/community/'+communityId+'/membership').set('authorization', token)
      .send(membership).end(parseResponse.bind(null, callback));
  }

  function addRequest () {}
  function addInvite () {}
  function addTopic (token, communityId, topic, callback) {
    (REST()).put('/community/'+communityId+'/topics').set('authorization', token)
      .send(topic).end(parseResponse.bind (null, callback));
  }
  function addOpinion () {}
  function addComment () {}

  module.exports.REST = REST;
  module.exports.getTokenFile = getTokenFile;
  module.exports.withTokenOf = sendTokenRequest;
  module.exports.removeTokenFileOf = removeTokenFileOf;
  module.exports.parseResponse = parseResponse;

  module.exports.addCommunity = addCommunity;
  module.exports.addMembership = addMembership;
  module.exports.addRequest = addRequest;
  module.exports.addInvite = addInvite;
  module.exports.addTopic = addTopic;
  module.exports.addOpinion = addOpinion;
  module.exports.addComment = addComment;
})();