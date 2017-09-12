// ccSpell:words XMLHTTP
/* global appName, ActiveXObject */
;(function ajaxSystemEnclosure(scope) {
  'use strict';

  var defaults = {
    credentials: false,
    type: 'json',
    url: false,
    callback: false
  };

  function Ajax() {}

  Ajax.prototype = {
    get: makeAjaxRequest.bind({}, 'GET'),
    post: makeAjaxRequest.bind({}, 'POST'),
    put: makeAjaxRequest.bind({}, 'PUT'),
    delete: makeAjaxRequest.bind({}, 'DELETE'),
    setDefaults: setDefaults.bind({})
  };

  function handleError(callback, xmlHttp, data, errorMessage) {
    var error = new scope.error.customError(errorMessage,
                                  xmlHttp.status,
                                  data);

    error.url = xmlHttp.responseURL;
    error.response = xmlHttp.response;
    callback(error);
  }

  function makeAjaxRequest(method, url, data, callback, options) {
    var xmlHttp,
        isSendingData = (['GET', 'DELETE'].indexOf(method) === -1);

    if (!isSendingData) {
      options = callback;
      callback = data;
      data = undefined;
    }

    if (typeof url === 'undefined') {

      if (defaults.url) {
        url = defaults.url;
      } else {

        throw new Error('missing-url');
      }

    }

    options = options || {};

    if (options.credentials === undefined) {
      options.credentials = defaults.credentials;
    }

    if (options.type === undefined) {
      options.type = defaults.type;
    }

    xmlHttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

    xmlHttp.onload = function() {
      if (xmlHttp.readyState === XMLHttpRequest.DONE) {
        if (+xmlHttp.readyState === 4 && +xmlHttp.status === 200) {
          if (callback) {
            callback(xmlHttp.response);
          } else if (defaults.callback) {
            defaults.callback(xmlHttp.response);
          }
        } else {
          handleError(callback, xmlHttp, data, xmlHttp.statusText);
        }
      }
    };

    xmlHttp.onerror = handleError.bind({}, callback, xmlHttp, data);
    xmlHttp.withCredentials = (options.credentials !== undefined);
    xmlHttp.open(method, encodeURI(url), true);

    if (options.credentials) {
      xmlHttp.setRequestHeader('Authorization', options.credentials);
    }

    if (options.type) {
      xmlHttp.responseType = options.type;
    }

    if (isSendingData) {
      xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    }

    xmlHttp.send(data ? JSON.stringify(data) : false);

    return xmlHttp;
  }

  function setDefaults(options) {
    var key;

    for (key in options) {
      if (defaults.hasOwnProperty(key)) {
        defaults[key] = options[key];
      }
    }
  }

  scope.ajax = new Ajax();

})(window[appName] || module.exports);
