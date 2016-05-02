(function userControllerClosure() {
  'use strict';

  var nodemailer = require('nodemailer');

  var sergeant = require ('../helpers/sergeant.js');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var log = require('../helpers/logger.js');

  var tokenExpiration = 1000 * 60 * 60;// == 1 HOUR

  function connect (email, subject, content, authToken, mailer, callback) {
    tryCatch (function tryCatchConnect () {
      if (email === undefined ) {
        callback (Errors.missingInput('email'));
        return;
      }

      authToken.time = (new Date()).getTime();
      authToken.email = email;
      var encodedToken = Encryption.encode (authToken);

      if (content === undefined || content.indexOf('[authToken]') === -1) {
        content = encodedToken;
      } else {
        content = content.replace (/\[authToken]/g, encodedToken);
      }
      var text = content.replace(/(<br(\s?\/)?>|<\/p>|<\/div>)/gm, '\n').replace(/<(?:.|\n)*?>/gm, '');
      mailer.send(email, '', subject, text, content, onConnectMailSent.bind(null,email,encodedToken,  callback));

    },callback);
  }
  function onConnectMailSent (email,encodedToken,  callback, data) {
    if (data instanceof Error) {
      log ('failed to send token to sent to ' + email + ': '+ encodedToken);
      log (data);
    }
    callback (data);
  }
  exports.connect = connect;

  function authenticate (token, authToken, db, callback) {
    tryCatch (function tryCatchConnect () {
      var decryptedToken;
      if (token === undefined) {
        callback (Errors.missingInput('token'));
        return;
      }
      try {
        decryptedToken = Encryption.decode(token);
      }
      catch (err) {
        callback (Errors.badInput('token',token));
        return;
      }
      if ((new Date()).getTime() - tokenExpiration > decryptedToken.time) {
        callback (Errors.expired('token'));
        return;
      }
      if (decryptedToken.localIP !== authToken.localIP || decryptedToken.serverIP !== authToken.serverIP) {
        callback (Errors.unauthorized());
        return;
      }

      sergeant({
        user : { table: db.user,
                  load: {email:decryptedToken.email},
                  beforeSave: prepareAuthenticatedUser.bind(null, decryptedToken, db),
                  save: true }}, 'user', onAuthenticateUserAdded.bind(null, decryptedToken, callback));

    },callback);
  }

  function prepareAuthenticatedUser (token, db, data) {
    var user = data.user;
    if (user !== null && user !== undefined) {
      token.user = { lastLogin: user.lastLogin };
      user.lastLogin = new Date();
    } else {
      data.user = db.user.model.getNew({ email : token.email });
    }
    return true;
  }

  function onAuthenticateUserAdded (authToken, callback, data) {
    var user = data.user;
    if (authToken.user === undefined) {
      authToken.user = {};
    }
    authToken.user.id = user.id;
    authToken.user.email = user.email;
    callback({ token: Encryption.encode(JSON.stringify(authToken)) });
  }
  exports.authenticate = authenticate;


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (authUser, db, callback) {
    sergeant({ user: { table: db.user, load: authUser.id, json:true }}, 'user',callback);
  }

  exports.get = get;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, user, db, callback) {
    sergeant({ user: { table: db.user, load: authUser.id,  beforeSave: sergeant.and(sergeant.stopIfNotFound, setUser.bind(null, user)), save:true, finally: sergeant.json }
    }, 'user',callback);
  }

  function setUser (jUser, data, tasks) {
    tasks.user.save = (sergeant.update(jUser, data.user) > 0);
    return true;
  }

  exports.set = set;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};
  function setControllers (controllerMap) {
    controllers = controllerMap;
  }
  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

})();