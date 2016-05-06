app = (typeof app !== 'undefined') ? app : {};
(function signupEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.getRedirectionURL = { attributes: { onclick : setRedirectTo.bind(this) } };

  function setRedirectTo () {
    this.state.redirect = location.href;
    return true;
  }

  function getBaseURL () {
    //return location.protocol+'//'+location.host;
    var url = location.href;
    var endOfString = url.indexOf('/#');
    if (endOfString === -1) {
      if (url.substr(url.length-1)) {
        url = url.substr(0,url.length-1);
      }
      return url;
    } else {
      return url.substr(0,endOfString);
    }
  }

  this.registry.frmJoin = { attributes: { onsubmit : onJoinSubmitted.bind(this)} };

  function onJoinSubmitted (evt) {
    var formValues = this.getFormFields(evt.target);
    var email = formValues.email;
    var userModel = this.models.user;

    if (userModel.email.validate(email)) {
      var redirect = (this.state.redirect ? this.state.redirect : location.href).replace('#join','');
      var mailSubject = O.TPL.translate('mailSubject.joinTheConversation');
      var mailContent = O.TPL.render({
        joinMail: {
          baseURL: getBaseURL(),
          redirect: encodeURIComponent(redirect),
          expire: moment().add(1,'hours').format('k:mm (MMM Do YYYY)')
        }
      });

      this.api.postConnectionToken(email, mailSubject, mailContent, onJoinResponsded.bind(this));
    } else {
      this.setValidationMessage (O.ELM.joinEmail, O.TPL.translate('error.pleaseUseProperEmail'));
    }
    return false;
  }

  function onJoinResponsded (response) {
    if (response instanceof Error) {
      this.notify ({
        notifySystem : { message: O.TPL.translate ('notify.failedToMailToken'), status:'error' }
      });
      this.log(response,this.logType.debug);
    } else {
      this.notify ({
        notifySystem : { message: O.TPL.translate ('notify.lookForYourJoinEmail'), status:'success' }
      });
    }
  }

////////////////////////////////////////////////////////////////////////////////

this.registry.userConnectRedirectPage = { preprocess: registerUserConnectPage.bind(this)} ;
this.registry.userConnectPage = { preprocess: registerUserConnectPage.bind(this)} ;

function registerUserConnectPage (dElm, callback) {
  var connectionToken = this.state.connect;
  if (connectionToken && connectionToken.length > 0) {
    this.api.getAuthToken(connectionToken, gotAuthToken.bind(this, callback));
  } else {
    this.updateURL('');
  }

}

function gotAuthToken (callback, response) {
  if (response instanceof Error) {
    this.log('error connecting',this.logType.error);
    this.log(response, this.logType.debug);
  } else {
    O.COOKIE('authToken', response.token, 90);
    this.api.clearCache();
    location.href = (this.state.redirect && this.state.redirect.length > 0) ? this.state.redirect : getDomain();
  }
  callback();
}

////////////////////////////////////////////////////////////////////////////////

this.registry.btnSignOut = { attributes: { onclick : onSignOutClicked.bind(this)} };

function onSignOutClicked (evt) {
  this.signout();
  this.goToStateRedirect();
  return false;
}
this.signout = (function () {
  O.COOKIE('authToken','');
  this.state.email = '';
  this.api.clearCache();
}).bind(this);

////////////////////////////////////////////////////////////////////////////////

return this;}).call(app);
