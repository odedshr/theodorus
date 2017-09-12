/* global O, appName */
;(function userUiEnclosure(scope) {
  'use strict';

  function user() {}

  user.prototype = {
    authenticate: authenticate,
    connect: connect,
    disconnect: disconnect,
    isConnected: isConnected,
    get: get,
    init: init
  };

  scope.onReady(function() {
    scope.io.add(user);
  });

  //////////////////////////////////////////////////////////////////////////////

  function getRedirectUrl() {
    return location.href;
  }

  function getBaseURL() {
    //return location.protocol+'//'+location.host;
    return location.href.split('#')[0].replace(/\/$/, '');
  }

  function authenticate(email, callback) {
    if (!scope.validate.email(email)) {
      throw scope.error.badInput('email', email);
    }

    if (callback === undefined) {
      callback = scope.log;
    }

    return scope.api.user.authenticate(email,
      scope.template.translate('mailSubject.joinTheConversation'),
      scope.template.render({
        joinMail: {
          baseURL: getBaseURL(),
          redirect: encodeURIComponent(getRedirectUrl()),
          expire: moment().add(1, 'hours').format('k:mm (MMM Do YYYY)')
        }
      }),
      callback);
  }

  function connect(token, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    return scope.api.user.connect(token, connected.bind({}, callback));
  }

  function connected(callback, response) {
    if (response instanceof Error) {
      callback(response);
    } else {
      scope.cookie('authToken', response.token, 90);
      callback(true);
    }
  }

  function disconnect() {
    scope.cookie('authToken', '');

    return true;
  }

  function isConnected() {
    return !!scope.cookie('authToken');
  }

  //////////////////////////////////////////////////////////////////////////////

  function get(callback) {
    if (typeof callback !== 'function') {
      throw scope.error.missingInput('callback');
    } else if (isConnected()) {
      scope.api.user(callback);
    } else {
      throw scope.error.unauthorized();
    }
  }

  function setUserInstance(callback, data) {
    scope.user = data.user;
  }

  function init(callback) {
    try {
      get(setUserInstance.bind({}, callback));
    }
    catch (err) {
      setUserInstance(callback, { user: {} });
    }

    if (typeof callback === 'function') {
      callback();
    }
  }

})(window[appName] || module.exports);
