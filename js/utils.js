app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.templates || {};
  this.templates = this.templates || {};

  this.ifNotError = (function ifNotError (callback, item) {
    if (item instanceof Error) {
      alert (item);
    } else {
      callback(item);
    }
  }).bind(this);

  this.simplyReturn = (function simplyReturn (value) {
    return value;
  }).bind(this);

  this.isProduction = (function isProduction () {
    var url = location.href;
    return (url.indexOf('localhost') === -1) && (url.indexOf('127.0.0.1') === -1);
  })();

  this.logType = {
    'debug': 'debug',
    'system': 'system',
    'community': 'community',
    'message': 'message',
    'score': 'score',
    'error': 'error'
  };
  this.log = (function log (value, type, color) {
    var types = this.logType;
    if (type=== undefined) {
      type = types.system;
    }
    switch (type) {
      case types.debug:
        console.debug(value);
      break;
      case types.system:
        this.notify({notifySystem:{ message: value, status:'info' }});
      break;
      case types.community:
        this.notify({notifyCommunity:{ message: value, status:'info' }});
      break;
      case types.message:
        this.notify({notifyMessage:{ message: value, status:'info' }});
      break;
      case types.score:
        this.notify({notifyScore:{ message: value, status:'info' }});
      break;
      case types.error:
        if (value instanceof Error) {
            console.debug(value);
            value = value.message;
        }
        this.notify({notifySystem:{ message: value, status:'error' }});
      break;
      default:
        if (!this.isProduction) {
          if (color === undefined) {
            console.log(type+': '+ value);
          } else {
            console.log(type+': '+ value, color);
          }
        }
      break;
    }
    return value;
  }).bind(this);
//==================================/

  this.clone = function clone (object) {
    return JSON.parse(JSON.stringify(object));
  };

  //==================================/
  this.confirm  = (function confirm (string, callback) {
    callback(window.confirm(string));
  }).bind(this);
  //==================================/

  this.extend = (function extend(obj, src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) {
        obj[key] = src[key];
      }
    }
    return obj;
  }).bind(this);

  //==================================/
  this.goToStateRedirect =(function goToStateRedirect () {
    var hash =  (this.state.redirect ? this.state.redirect : '');
    history.pushState({}, hash, location.href.split('#')[0]+'#'+ hash);
    this.register(O.ELM.appContainer);
  }).bind(this);


  this.getPathFromURL = (function getPathFromURL () {
    return location.href.replace(new RegExp('(https?:\\/\\/)|('+location.host+'\\/)','g'),'').split('#')[0].split('?')[0];
  }).bind(this);

  this.extractArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
    var pl   = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^\/:]+):?([^\/]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.hash.substring(1);
    var output = [];
    var match = search.exec(query);
    while (match) {
      var obj = {
        key: decode(match[1]),
        value: decode(match[2])
      };
      output.push(obj);
      match = search.exec(query);
    }

    return output;
  }).bind(this);

  var mapParametersFromSearchQuery = (function mapParametersFromSearchQuery () {
    var pl   = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);
    var urlParams = {};
    var match = search.exec(query);
    while (match ) {
      urlParams[decode(match[1])] = decode(match[2]);
      match = search.exec(query);
    }

    return urlParams;
  });

  var mapArgumentsFromLocationHashInternalDecode = function mapArgumentsFromLocationHashInternalDecode (pl, s) {
    return decodeURIComponent(s.replace(pl, " "));
  };

  var mapArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
    var pl   = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^\/:]+):?([^\/]*)/g,
      decode = mapArgumentsFromLocationHashInternalDecode.bind(this,pl),
      query  = window.location.hash.substring(1);
    var output = {};
    var match = search.exec(query);
    while (match) {
      output[decode(match[1])] = decode(match[2]);
      match = search.exec(query);
    }

    return output;
  });

  this.getMappedArguments = (function getInputParameters () {
    return this.extend(mapParametersFromSearchQuery(), mapArgumentsFromLocationHash());
  }).bind(this);

  //==================================/
  function isFormFieldDirty (dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked !== dElm.defaultChecked;
      case 'select-one': return !dElm.options[dElm.selectedIndex].defaultSelected;
      default:
        return dElm.value !== dElm.defaultValue;
    }
  }

  function getFormFieldValue (dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked;
      case 'select-one': return !dElm.options[dElm.selectedIndex].value;
      default:
        return dElm.value;
    }
  }

  this.getFormFields = (function getFormFields (formElement, onlyDirty) {
    var formFields = formElement.elements;
    var data = {};
    var errors = [];
    for (var field in formFields) {
      if (formFields.hasOwnProperty(field)) {
        var dElm = formFields[field];
        if (dElm.name && dElm.name.length > 0 && !onlyDirty || isFormFieldDirty(dElm)) {
          if (typeof dElm.checkValidation === 'function' && dElm.checkValidation() === false) {
            errors[errors.length] = element;
          } else if (dElm.name && dElm.name.length > 0) {
            data[dElm.name] = getFormFieldValue(dElm);
          }
        }
      }
    }
    if (errors.length > 0) {
          var error = new Error('validation-erros');
          error.fields = errors;
          throw error;
    }

    return data;
  }).bind(this);

  this.getDirtyFormFields = (function getFormFields (formElement) {
    return this.getFormFields(formElement, true);
  }).bind(this);

  this.setValidationMessage = (function getFormFields (dField, message) {
    dField.setCustomValidity(message);
    var errorField = O.ELM[dField.id + 'Errors'];
    if (errorField) {
        errorField.innerHTML = message;
    }
  }).bind(this);

  //==================================/
  this.registerChildren = (function registerChildren (subElements) {
    var elmCount = subElements.length;
    while (elmCount--) {
      var dElm = subElements[elmCount];
      if (dElm.style.display !== 'none') {
        this.register(dElm);
      }
    }
  }).bind(this);

  function render (dElm, templateName, content) {
    if (templateName === undefined) {
      if (content === undefined) {
        return;
      } else {
        this.log('no template for ' + templateName, this.logType.debug);
        throw new Error('template-not-found');
      }
    }

    try {
      if (this.templates[templateName]) {
        var data = {};
        data[templateName] = content;
        dElm.innerHTML = O.TPL.render(data);
        O.ELM.refresh();
      } else {
        this.log('no template for ' + templateName,this.logType.debug);
      }
      this.registerChildren(dElm.querySelectorAll('[data-register]:not(.js-registered)'));
    }
    catch (err) {
      this.log(err,this.logType.debug);
      this.log(dElm,this.logType.debug);
      this.log(templateName,this.logType.debug);
      this.log(content,this.logType.debug);
    }
  }

  this.register = (function register (dElm) {
    var templateName = dElm.getAttribute('data-register');

    if ( templateName === undefined ) {
      templateName = dElm.getAttribute ('id');
    }
    O.CSS.remove(dElm,'register').add (dElm,'registering');

    var component = this.registry[templateName];
    if (component !== undefined && component.attributes !== undefined) {
      var attr = component.attributes;
      for (var key in attr) {
        dElm[key] = attr[key];
      }
    }

    if (component === undefined) {
      if (this.templates[templateName] === undefined) {
        throw new Error('cannot register template '+templateName);
      } else {
        render.call(this, dElm,templateName, {});
      }
    } else if (component.preprocess !== undefined){
      component.preprocess.call(this, dElm, render.bind(this,dElm,templateName));
    }

    O.CSS.remove(dElm,'registering').add(dElm,'registered');
  }).bind(this);

  this.onWindowResize = (function onWindowResize() {
    this.registerChildren(O.ELM.per('.js-register'));
  }).bind(this);

  window.onresize = O.EVT.subscribe('window.resize',this.onWindowResize).getDispatcher('window.resize');

return this;}).call(app);
