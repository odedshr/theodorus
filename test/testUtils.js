(function () {
  'use strict';

  var fs = require ('fs');
  var chromedriver = require('chromedriver');
  var webdriver = require('selenium-webdriver');
  var url = 'http://127.0.0.1:8080/';
  var serverURL = 'http://127.0.0.1:5000';

  var chai = require('chai');
  chai.use(require('chai-as-promised'));

  var request = require('supertest');

  function getTokenFile (email) {
    return '../theodorus/user-files/debug_'+email+'.json';
  }

  function REST () {
    return request(serverURL);
  }

  function getAuthToken (browser, tokenFile, callback, err,response) {
    browser.get(url+'#user/connect:'+require('../'+tokenFile).token);
    if (fs.existsSync(tokenFile.substr(1))) {
      fs.unlinkSync (tokenFile.substr(1));
    } else if (fs.existsSync(tokenFile)) {
      fs.unlinkSync (tokenFile);
    }
    callback();
  }

  function connect (browser, email, callback) {
    var tokenFile = getTokenFile(email);
    if (!fs.existsSync(tokenFile)) {
      console.log(email + ' => '+tokenFile);
      (REST ()).post('/user/connect').send({email: email}).end(getAuthToken.bind(null, browser, tokenFile, callback));
    } else {
      console.log('file already exists '+tokenFile);
      getAuthToken(browser, tokenFile, callback);
    }
  }

  module.exports.connect = connect;

  function browser () {
    return new webdriver.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
  }
  module.exports.browser = browser;
  module.exports.chai = chai;
  module.exports.assert = chai.assert;
  module.exports.expect = chai.expect;
  module.exports.url = url;
  module.exports.webdriver = webdriver;
  //runNextTest(fs.readdirSync('.'));

})();
