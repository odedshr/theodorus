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
      console.log('removing ' + filename);
      fs.unlinkSync (filename);
    } else {
      console.log('file not exists ' + filename);
    }
  }

  function getAuthToken (tokenFile, callback) {
    (REST ()).get('/user/connect/'+require(tokenFile).text).end(setToken.bind(null, callback));
  }
  function sendTokenRequest (email, callback) {
    var tokenFile = getTokenFile(email);
    if (!fs.existsSync(tokenFile)) {
      (REST ()).post('/user/connect').send({email: email}).end(getAuthToken.bind(null, tokenFile, callback));
    } else {
      getAuthToken(tokenFile, callback);
    }
  }
  function addCommunity (token, input, callback) {
    function communityAdded (error, response) {
      if (error !== null) {
        throw error;
      }
      callback (JSON.parse(response.text));
    }

    (REST()).put('/community').send(input).set('authorization', token).end(communityAdded);
  }
  function addMembership (token, communityId, input, callback) {
    (REST()).put('/community/'+communityId+'/membership').set('authorization', token).send(input).end(callback);
  }

  function addRequest () {}
  function addInvite () {}
  function addTopic () {}
  function addOpinion () {}
  function addComment () {}

  module.exports.REST = REST;
  module.exports.getTokenFile = getTokenFile;
  module.exports.withTokenOf = sendTokenRequest;
  module.exports.removeTokenFileOf = removeTokenFileOf;


  module.exports.addCommunity = addCommunity;
  module.exports.addMembership = addMembership;
  module.exports.addRequest = addRequest;
  module.exports.addInvite = addInvite;
  module.exports.addTopic = addTopic;
  module.exports.addOpinion = addOpinion;
  module.exports.addComment = addComment;
})();