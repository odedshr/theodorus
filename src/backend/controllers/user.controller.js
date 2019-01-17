import { Errors } from 'groundup';
import logger from '../helpers/logger.js';
import sergeant from '../helpers/sergeant.js';
import Encryption from '../helpers/Encryption.js';

class UserController {
  constructor(tokenExpiration = 1000 * 60 * 60/* 1 HOUR */) {
    this.tokenExpiration = tokenExpiration;
  }

  connect(email, subject, content, authToken, mailer) {
    return new Promise(resolve => resolve())
    .then(() => {
      if (email === undefined) {
        throw new Errors.MissingInput('email');
      }
  
      const encodedToken = Encryption.encode(JSON.stringify(Object.assign(authToken, {
        time: (new Date()).getTime(),
        email
      })));
      
      // if email-content is empty or doesn't have a place for the authToken, just send the autoToken
      if (content === undefined || content.indexOf('[authToken]') === -1) {
        content = encodedToken;
      } else {
        content = content.replace(/\[authToken]/g, encodedToken);
      }
      
      const text = content
        .replace(/(<br(\s?\/)?>|<\/p>|<\/div>)/gm, '\n')
        .replace(/<(?:.|\n)*?>/gm, '');
      
      return mailer
        .send(email, '', subject, text, content)
        .then(data => {
          if (data instanceof Error) {
            logger.error(`failed to send token to sent to ${email}: ${encodedToken}`, data);
          }
        
          return data;
        });
    })
    .catch(err => err);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  authenticate(token, authToken, db) {
    return new Promise(resolve => resolve())
    .then(() => {
      let decryptedToken;

      if (token === undefined) {
        throw new Errors.MissingInput('token');
      }

      try {
        decryptedToken = JSON.parse(Encryption.decode(token));
      }
      catch (err) {
        throw new Errors.BadInput('token', token);
      }

      if ((new Date()).getTime() - this.tokenExpiration > decryptedToken.time) {
        throw new Errors.Expired('token');
      }

      if (decryptedToken.localIP !== authToken.localIP || decryptedToken.serverIP !== authToken.serverIP) {
        throw new Errors.Unauthorized();
      }

      return decryptedToken.email;
    })
    .then(email => {
      return sergeant({
        user: {
          table: db.user,
          load: { email: email },
          beforeSave(data) {
            const { user } =data;
            if (user !== null && user !== undefined) {
              decryptedToken.user = { lastLogin: user.lastLogin };
              user.status = db.user.model.status.active;
              user.lastLogin = new Date();
            } else {
              data.user = db.user.create({ email });
            }
          
            return true;
          },
          save: true 
        } 
      });
    })
    .then(({user}) => {
      const { id, email } = user;
      authToken.user = {id, email};
    
      return({ token: Encryption.encode(JSON.stringify(authToken)) });
    })
    .catch(err => { console.trace('user.authenticate', err); return err; });
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
  
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  get(authUser, db) {
    return { authUser };
    // return sergeant({
    //   user: {
    //     table:db.user,
    //     load: authUser.id,
    //     json: true
    //   }
    // }, 'user');
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