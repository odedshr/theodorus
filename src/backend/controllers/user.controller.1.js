import { Errors } from 'groundup';
import logger from '../helpers/logger.js';
import sergeant from '../helpers/sergeant.js';
import Encryption from '../helpers/Encryption.js';

class UserController {
  constructor(tokenExpiration = 1000 * 60 * 60/* 1 HOUR */) {
    this.tokenExpiration = tokenExpiration;
  }

  connect(email, subject, content, authToken, mailer) {
      if (email === undefined) {
      throw new Errors.missingInput('email');
    }

    authToken.time = (new Date()).getTime();
    authToken.email = email;
    const encodedToken = Encryption.encode(authToken);
    
    if (content === undefined || content.indexOf('[authToken]') === -1) {
      content = encodedToken;
    } else {
      content = content.replace(/\[authToken]/g, encodedToken);
    }
    
    text = content.replace(/(<br(\s?\/)?>|<\/p>|<\/div>)/gm, '\n').replace(/<(?:.|\n)*?>/gm, '');
    
    return mailer.send(email, '', subject, text, content).then(data => {
      if (data instanceof Error) {
        logger.error(`failed to send token to sent to ${email}: ${encodedToken}`, data);
      }
    
      return data;
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  authenticate(token, authToken, db, callback) {
    tryCatch(function tryCatchConnect() {
      var decryptedToken;
  
      if (token === undefined) {
        callback(Errors.missingInput('token'));
  
        return;
      }
  
      try {
        decryptedToken = Encryption.decode(token);
      }
      catch (err) {
        callback(Errors.badInput('token', token));
  
        return;
      }
  
      if ((new Date()).getTime() - tokenExpiration > decryptedToken.time) {
        callback(Errors.expired('token'));
  
        return;
      }
  
      if (decryptedToken.localIP !== authToken.localIP || decryptedToken.serverIP !== authToken.serverIP) {
        callback(Errors.unauthorized());
  
        return;
      }
  
      sergeant({
        user: { table: db.user,
                  load: { email: decryptedToken.email },
                  beforeSave: prepareAuthenticatedUser.bind(null, decryptedToken, db),
                  save: true } }, 'user', onAuthenticateUserAdded.bind(null, decryptedToken, callback));
  
    }, callback);
  }
  
  prepareAuthenticatedUser(token, db, data) {
    var user = data.user;
  
    if (user !== null && user !== undefined) {
      token.user = { lastLogin: user.lastLogin };
      user.status = db.user.model.status.active;
      user.lastLogin = new Date();
    } else {
      data.user = db.user.model.getNew({ email: token.email });
    }
  
    return true;
  }
  
  onAuthenticateUserAdded(authToken, callback, data) {
    var user = data.user;
  
    if (authToken.user === undefined) {
      authToken.user = {};
    }
  
    authToken.user.id = user.id;
    authToken.user.email = user.email;
    callback({ token: Encryption.encode(JSON.stringify(authToken)) });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  get(authUser, db) {
    return sergeant({
      user: {
        table:db.user,
        load: authUser.id,
        json: true
      }
    }, 'user');
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  set(authUser, user, db, callback) {
    if (user === undefined) {
      throw new Errors.MissingInput('user');
    }
  
    return sergeant({
      user: {
        table: db.user,
        load: authUser.id,
        beforeSave: sergeant.and(sergeant.stopIfNotFound, setUser.bind(null, user)),
        finally: sergeant.json
      }
    }, 'user');
  }
  
  setUser(jUser, data, tasks) {
    tasks.user.save = (sergeant.update(jUser, data.user) > 0);
  
    if (tasks.user.save && jUser.isFemale === null) {
      data.user.isFemale = null;
      data.user.set('isFemale', null);
    }
  
    return true;
  }
}

export default new UserController();