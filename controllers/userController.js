(function userControllerClosure() {
  'use strict';

  var nodemailer = require('nodemailer');

  var sergeant = require ('../helpers/sergeant.js');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var log = require('../helpers/logger.js');

  var tokenExpiration = 1000 * 60 * 60;// == 1 HOUR

  function connect (email, subject, content, authToken, mailer, files, callback) {
    tryCatch (function tryCatchConnect () {
      if (email === undefined ) {
        callback (Errors.missingInput('email'));
        return;
      }

      authToken.time = (new Date()).getTime();
      authToken.email = email;
      var encodedToken = Encryption.encode (authToken);

      if (content === undefined || content.indexOf('[authToken]')) {
        content = encodedToken;
      } else {
        content = content.replace (/\[authToken]/g, encodedToken);
      }
      var text = content.replace(/(<br(\s?\/)?>|<\/p>|<\/div>)/gm, '\n').replace(/<(?:.|\n)*?>/gm, '');
      if (email.indexOf('@test.suite.') > -1) {
        files.set('debug_'+email+'.json', JSON.stringify({
          email: email,
          subject: subject,
          text: text,
          html: content
        }), callback);
      } else {
        mailer.send(email, '', subject, text, content, callback);
        log('token sent to ' + email + ': '+ encodedToken);
      }
    },callback);
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

      db.user.one({email:decryptedToken.email}, sergeant.onLoad.bind({}, 'user', onAuthenticateUserLoaded.bind(null, decryptedToken, db, callback), callback, false) );

    },callback);
  }

  function onAuthenticateUserLoaded (token, db, callback, user) {
    tryCatch(function tryCatchSigninOnLoaded() {
    if (user !== null) {
      token.user = {
        id : user.id,
        email: user.email,
        lastLogin: user.lastLogin
      };
      user.lastLogin = new Date();
      user.save();
      callback({ token: Encryption.encode(JSON.stringify(token)) });
    } else {
      var oUser = db.user.model.getNew({ email : token.email });
      db.user.create(oUser, onAuthenticateUserAdded.bind(null, token, callback));
    }

    },callback);
  }

  function onAuthenticateUserAdded (authToken, callback, err, user) {
    if (err) {
      callback (new Error(err));
    } else {
      if (authToken.user === undefined) {
        authToken.user = {};
      }
      authToken.user.id = user.id;
      authToken.user.email = user.email;
      callback({ token: Encryption.encode(JSON.stringify(authToken)) });
    }
  }
  exports.authenticate = authenticate;


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (authUser, db, callback) {
    sergeant({ user: { table: db.user, load: authUser.id, json:true }}, 'user',callback);
  }

  exports.get = get;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, user, db, callback) {
    sergeant({ loadUser: { table: db.user, load: authUser.id, after:sergeant.stopIfNotFound },
               user: { before: setUser.bind(null, user), save:true, json:true }
    }, 'loadUser,user',callback);
  }

  function setUser (jUser, data, tasks, currentTaskName) {
    var user = data.loadUser;
    delete data.loadUser;
    tasks[currentTaskName].save = (sergeant.update(jUser, user) > 0);
    tasks[currentTaskName].data = user;
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