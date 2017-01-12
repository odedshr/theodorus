;(function userUiEnclosure(scope) {
  'use strict';

  function getRedirectUrl() {
    return (scope.state.redirect ? scope.state.redirect : location.href).replace('#join','');
  }

  function getBaseURL () {
    //return location.protocol+'//'+location.host;
    return location.href.split('#')[0].replace(/\/$/,'');
  }

  function authenticate (email, callback) {
    if (!scope.validate.email(email)) {
      throw scope.error.badInput('email',email);
    }
    if (callback === undefined) {
      callback = scope.log;
    }

    return scope.api.user.authenticate(email,
      O.TPL.translate('mailSubject.joinTheConversation'),
      O.TPL.render({
        joinMail: {
          baseURL: getBaseURL(),
          redirect: encodeURIComponent(getRedirectUrl()),
          expire: moment().add(1,'hours').format('k:mm (MMM Do YYYY)')
        }
      }),
      callback);
  }

  function connect (token, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }
    return scope.api.user.connect(token, connected.bind({},callback));
  }

  function connected (callback, response) {
    if (response instanceof Error) {
      callback(response);
    } else {
      O.COOKIE('authToken', response.token, 90);
      callback(true);
    }
  }

  function disconnect() {
    O.COOKIE('authToken','');
    return true;
  }

  function isConnected() {
    return !!O.COOKIE('authToken');
  }

  scope.cli._add('user', {
    authenticate : authenticate,
    connect : connect,
    disconnect: disconnect,
    isConnected: isConnected
  });
})(theodorus);
