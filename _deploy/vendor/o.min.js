〇=O=(function(){
  this.VER = { framework: '0.1.2' };

  this.isNodeJS = (typeof window === 'undefined');

  function DetailedError (message, stack) {
    this.message = message;
    this.stack = stack;
  }

  DetailedError.prototype = Object.create(Error.prototype);
  DetailedError.prototype.constructor = DetailedError;

  if (!this.isNodeJS) {
    this.COOKIE = (function COOKIE () {
      var iCOOKIE = (function (key, value, exdays) {
        if (value !== undefined) {
          if (exdays === undefined) {
            exdays = 0;
          }
          var d = new Date();
          d.setTime(d.getTime() + (exdays*24*60*60*1000));
          var expires = "expires="+d.toUTCString();
          document.cookie = key + "=" + value + "; " + expires;
          return this;
        } else {
          return document.cookie.replace(new RegExp('(?:(?:^|.*;\\s*)'+key+'\\s*\\=\\s*([^;]*).*$)|^.*$'), "$1");
        }
      }).bind(this);
      return iCOOKIE;
    }).call(this);
    this.EVT = (function EVT() {
      var iEVT = {},
        oldOnLoad = window.onload ? window.onload : false,
        dispatch = function dispatchEvent (eventName, content) {
          return document.dispatchEvent(new CustomEvent(eventName, {detail: content}));
        },
        getDispatcher = function getEventDispatcher (eventName, fHandler) {
          if (typeof fHandler === 'function') {
            subscribe(eventName, fHandler);
          }
          return function (evt) {
            return dispatch (eventName,evt);
          };
        },
        subscribe = function subscribe (eventName, fHandler) {
          document.addEventListener(eventName,fHandler);
          return this;
        },
        unsubscribe = function unsubscribe (eventName, fHandler) {
          document.removeEventListener(eventName,fHandler);
          return this;
        };
      iEVT.subscribe = subscribe.bind(iEVT);
      iEVT.unsubscribe = unsubscribe.bind(iEVT);
      iEVT.dispatch = dispatch.bind(iEVT);
      iEVT.getDispatcher = getDispatcher.bind(iEVT);

      window.onload = iEVT.getDispatcher("window.onload");
      if (oldOnLoad) {
        iEVT.subscribe("window.onload",oldOnLoad);
      }
      return iEVT;
    }).call(this);
    this.ELM = (function ELM() {
      var iELM = {};
      var refresh = (function refresh () {
        var list = this;
        for (var member in this) {
          if (this.hasOwnProperty(member) && typeof this[member] !== 'function') {
            delete this[member];
          }
        }
        [].forEach.call(document.querySelectorAll("[id]"), function perDOMElement(dElm) {
          list[dElm.id]= dElm;
        });
        return this;
      }).bind(iELM);
      var anObserver = new MutationObserver(refresh.bind(iELM));
      var observerParameters = { childList: true, subtree: true,attributes: false, characterData: false, attributeOldValue: false, characterDataOldValue: false };
      var observe = (function observe (isEnabled) {
        if (isEnabled) {
          anObserver.observe(document.body, observerParameters);
          refresh();
        } else {
          anObserver.disconnect();
        }
        return this;
      }).bind(iELM);
      var forEach = function (callback) {
        var args = [];
        for (var a = 0; a < arguments.length; a++) {
          args[a] = arguments[a];
        }
        for (var i = 0; i < this.length; i++) {
          args[0] = this[i];
          callback.apply(this, args);
        }
        return this;
      };
      var per = (function per (query) {
        var elements = document.querySelectorAll(query);
        elements.each = forEach.bind (elements);
        elements.remove = forEach.bind (elements, this.DOM.remove);
        elements.useAsTemplate = forEach.bind (elements, this.TPL.use);
        elements.html = forEach.bind (elements, function (dElm,html) { dElm.innerHTML = html; });
        elements.css = {
          add : forEach.bind (elements, this.CSS.add),
          remove : forEach.bind (elements, this.CSS.remove),
          toggle : forEach.bind (elements, this.CSS.toggle)
        };
        return elements;
      }).bind(this);
      iELM.refresh = refresh;
      iELM.per = per.bind (iELM);
      iELM.observe = observe;
      this.EVT.subscribe("window.onload",(function refreshAndStartObserver() {
        observe(true);
      }).bind(this));
      return iELM;
    }).call(this);
    this.DOM = (function DOM() {
      var iDOM = {};
      var create = function create (tag, attributes,innerHTML) {
        var dElm = document.createElement(tag);
        if (attributes) {
          Object.keys(attributes).forEach(function perAttribute(key){
            dElm.setAttribute(key,attributes[key]);
          });
        }
        if (innerHTML) {
          dElm.innerHTML = innerHTML;
        }
        return dElm;
      };
      var domParser = new DOMParser();
      var parse = function parse (string) {
        return domParser.parseFromString(string.trim(),"text/html").body.firstChild;
      };
      var getElement = function getElement (dNewElm) {
        return (typeof dNewElm === 'string') ? parse(dNewElm) : dNewElm;
      };
      var insertBefore = function insertBefore (dElm,dNewElm) {
        dElm.parentNode.insertBefore(getElement(dNewElm), dElm);
        return this;
      };
      var insertAfter = function insertAfter (dElm,dNewElm) {
        dElm.parentNode.insertBefore(getElement(dNewElm), dElm.nextSibling);
        return this;
      };
      var prepend = function prepend (dElm,dNewElm) {
        dElm.insertBefore(getElement(dNewElm), dElm.firstChild);
        return this;
      };
      var append = function append (dElm,dNewElm) {
        dElm.appendChild(getElement(dNewElm));
        return this;
      };
      var remove = function remove (dElm) {
        if (typeof dElm !== 'object') {
          throw 'bad input for DOM.remove function ('+dElm+')';
        }
        else if (dElm.parentNode && dElm.removeChild) {
          dElm.parentNode.removeChild(dElm);
        } else {
          throw 'cannot remove child without a parentNode';
        }
      };
      iDOM.create = create.bind(iDOM);
      iDOM.parse = parse.bind(iDOM);
      iDOM.insertBefore = insertBefore.bind(iDOM);
      iDOM.insertAfter = insertAfter.bind(iDOM);
      iDOM.prepend = prepend.bind(iDOM);
      iDOM.append = append.bind(iDOM);
      iDOM.remove = remove.bind(iDOM);
      return iDOM;
    }).call(this);
    this.CSS = (function CSS() {
      var iCSS = {};
      var jsPrefixString = 'js-';
      var isJsPrefixed = true;
      var getJSPrefix = function () {
        return isJsPrefixed ? jsPrefixString : '';
      };
      var has = function hasClass (dElm, className) {
        return dElm && (dElm.className.split(" ").indexOf(getJSPrefix()+className)>-1);
      };
      var toggle = function toggle (dElm, className,isAdd,isRemove) {
        var classes = dElm.className.split(" "),
          isAlreadyExists = (classes.indexOf(getJSPrefix()+className)!=-1);
        if (isAlreadyExists) {
          if (isRemove || (!isAdd && !isRemove)) {
            classes.splice(classes.indexOf(getJSPrefix()+className),1);
          }
        } else if (isAdd || (!isAdd && !isRemove)) {
           classes.push(getJSPrefix()+className);
        }
        dElm.className = classes.join(" ");
        return this;
      };
      var add = function add (dElm, className) {
        var classes = dElm.className.split(" ");
        if (classes.indexOf(getJSPrefix()+className)==-1) {
          classes.push(getJSPrefix()+className);
        }
        dElm.className = classes.join(" ");
        return this;
      };
      var remove = function remove (dElm, className) {
        var classes = dElm.className.split(" ");
        if (classes.indexOf(getJSPrefix()+className)!=-1) {
          classes.splice(classes.indexOf(getJSPrefix()+className),1);
        }
        dElm.className = classes.join(" ");
        return this;
      };
      iCSS.has = has.bind(iCSS);
      iCSS.add = add.bind(iCSS);
      iCSS.remove = remove.bind(iCSS);
      iCSS.toggle = toggle.bind(iCSS);
      iCSS.toggle = toggle.bind(iCSS);
      iCSS.isJsPrefixed = function isJsPrefix(value) {
        if (typeof value !== 'undefined') {
          isJsPrefixed = value;
        }
        return isJsPrefixed;
      };
      return iCSS;
    }).call(this);
    this.AJAX = (function AJAX() {
      function handleError (callback, xmlhttp, data, errorMessage) {
        var error = new DetailedError(errorMessage, {});
        error.status = xmlhttp.status;
        error.url = xmlhttp.responseURL;
        error.data = data;
        callback(error);
      }
      var iAJAX = {};
      var defaults = {
        credentials : false,
        type: 'json',
        url : false,
        callback : false
      };
      var makeAjaxRequest = function makeAjaxRequest (method, url, data, callback, options) {
        if (['GET', 'DELETE'].indexOf(method) > -1) {
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
        var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");

        xmlhttp.onload = function () {
          if (xmlhttp.readyState == XMLHttpRequest.DONE) {
            if (+xmlhttp.readyState == 4 && +xmlhttp.status == 200) {
              if (callback) {
                callback(xmlhttp.response);
              } else if (defaults.callback) {
                defaults.callback(xmlhttp.response);
              }
            }
            else {
              handleError(callback, xmlhttp, data, xmlhttp.statusText);
            }
          }
        };
        xmlhttp.onerror = handleError.bind(this,callback, xmlhttp, data);
        xmlhttp.withCredentials = (options.credentials !== undefined);
        xmlhttp.open(method, encodeURI(url), true);
        if (options.credentials) {
            xmlhttp.setRequestHeader("Authorization", options.credentials);
        }
        if (options.type) {
          xmlhttp.responseType = options.type;
        }
        xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xmlhttp.send(data ? JSON.stringify(data) : false);
        return xmlhttp;
      };
      var setDefaults = function setDefaults (options) {
        for (var key in options) {
          if (defaults.hasOwnProperty(key)) {
            defaults[key] = options[key];
          }
        }
      };

      iAJAX.get = makeAjaxRequest.bind(iAJAX,'GET');
      iAJAX.post = makeAjaxRequest.bind(iAJAX,'POST');
      iAJAX.put = makeAjaxRequest.bind(iAJAX,'PUT');
      iAJAX.delete = makeAjaxRequest.bind(iAJAX,'DELETE');
      iAJAX.setDefaults = setDefaults.bind(iAJAX);
      return iAJAX;
    }).call(this);
  }

  this.TPL = (function TPL() {
    var getDefaultLocale = (function () {
      return (this.isNodeJS) ? 'en-us' : ((window.navigator.userLanguage || window.navigator.language).toLowerCase());
    }).bind(this);
    var locale =  getDefaultLocale();
    var strings = {};
    strings[locale] = {};
    var iTPL = {};
    var templates = {};
    var delimiters = [{start: '{{', end: '}}'}];
    var stdPattern, lngPattern, ifPattern, ifNotPattern, loopPattern, innerPattern, fixPattern;
    var escapeRegExp = function escapeRegExp (string) {
      return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/gm, "\\$&");
    };
    var buildPatterns = (function buildPatterns(start, end) {
      stdPattern = new RegExp(start+'([^#]+?)'+end,'g');
      lngPattern = new RegExp(start+'#(.+?)'+end,'g');
      ifPattern = new RegExp(start+'\\?(.+?)'+end+'([\\s\\S]+?)'+start+'[\\/$]\\1'+end,'g');
      ifNotPattern = new RegExp(start+'\\?\\!(.+?)'+end+'([\\s\\S]+?)'+start+'\\/\\1'+end,'g');
      loopPattern = new RegExp(start+'([^@}]+?)@([\\s\\S]+?)(:([\\s\\S]+?))?'+end+'([\\s\\S]+?)'+start+'\\/\\1@\\2'+end,'g');
      innerPattern = new RegExp(start+'\\@([\\s\\S]+?)'+end+'([\\s\\S]+?)'+start+'\\/\\1'+end,'g');
      fixPattern = new RegExp(start+'\'([^\'}]+?)\',\'([\\s\\S]+?)\''+end+'([\\s\\S]+?)'+start+'\\/\'\\1\',\'\\2\''+end,'g');
      quotePattern = new RegExp('^\'.*\'$');
    }).bind(this);
    var templatePattern = new RegExp('<template data-id="([\\s\\S]+?)">([\\s\\S]+?)</template>','g');
    var use = (function use (dElm, id) {
      if (id === undefined && typeof dElm !== 'string') {
        id = dElm.getAttribute('data-template');
        if (id === undefined) {
          id = dElm.getAttribute('data-id');
        }
        if (id === undefined) {
          id = dElm.getAttribute('id');
        }
      }
      if (id) {
        templates[id] = (typeof dElm === 'string') ? dElm : (dElm.innerHTML ? dElm.innerHTML : dElm.html());
      } else {
        throw new Error('could not determine id for template '+ dElm);
      }
      return this;
    }).bind(iTPL);
    var list = function list () {
      return Object.keys(templates);
    };
    var load = (function load (sUrl) {
      this.AJAX.get(sUrl, (function (templateString) {
        var template;
        while ((template = templatePattern.exec(templateString)) !== null) {
          use(template[2],template[1]);
        }
        this.EVT.dispatch('TPL.templatesLoaded',list());
      }).bind(this), {type:'text'});
      return this;
    }).bind(this);
    var loadLanguage = (function loadLanguage (sUrl) {
      if (this.isNodeJS) {
        languageLoaded(require(sUrl));
      } else {
        this.AJAX.get(sUrl, languageLoaded, {type:'json'});
      }
      return this;
    }).bind(this);
    var languageLoaded = (function (response) {
      for (var locale in response) {
        if (response.hasOwnProperty(locale)) {
          appendToLanguage(locale, response[locale]);
        }
      }
      if (!this.isNodeJS) {
        this.EVT.dispatch('TPL.languageLoaded',Object.keys(response));
      }
    }).bind(this);
    var appendToLanguage = function appendToLanguage (locale,dictionary) {
      if (typeof strings[locale] === 'undefined') {
        strings[locale] = {};
      }
      for (var key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
          strings[locale][key] = dictionary[key];
        }
      }
      return this;
    };
    var setLocale = function setLocale (newLocale) {
      locale = newLocale ? newLocale : getDefaultLocale();
      return this;
    };
    var getLocale = function getLocale () {
      return locale;
    };
    var getValue = function (dataset, key) {
      var value = false;
      var keyAndTemplate = key.split(':');
      var template = keyAndTemplate[1];
      key = keyAndTemplate[0];
      if (key==='.') {
        value = dataset;
      } else {
        var nested = key.split('.');
        if (nested.length > 1) {
          value = dataset.hasOwnProperty(nested[0]) ? dataset[nested[0]] : nested[0];
          for (var i=1;i<nested.length;i++) {
            value = value.hasOwnProperty(nested[i]) ? value[nested[i]] : nested[i];
          }
        } else {
          value = dataset.hasOwnProperty(key) ? dataset[key] : (key === '.' ? dataset : key);
        }
      }
      if (template) {
        var subTemplateInfo = {};
        template = (template.match(quotePattern)) ? template.replace(/'/g,'') : getValue(dataset, template);
        subTemplateInfo[template] = value;
        return render(subTemplateInfo);
      } else  {
        return value;
      }
    };
    var toString = function toString (value) {
      return (typeof value === 'function' ? value() : (typeof value === 'object' ? JSON.stringify(value) : value));
    };
    var translate = function translate (value) {
      var translated = strings[locale][value];
      return toString((typeof translated !== 'undefined') ? translated : value.substr(value.indexOf('.')+1));
    };
    var render = function render (input){
      if (Object.keys(input).length !== 1) {
        throw new Error ('cannot render multiple templates!');
      }
      var templateName = Object.keys(input)[0];
      if (templates[templateName] === undefined) {
        throw new Error ('template not found:' + templateName);
      }
      return populate(templates[templateName], input[templateName]);

    };

    var populate = function (string, data) {
      var item;
      while ((item = fixPattern.exec(string)) !== null) {
        var delimiter = { start: escapeRegExp(item[1]), end: escapeRegExp(item[2]) };
        delimiters.push(delimiter);
        buildPatterns(delimiter.start, delimiter.end);
        string = string.split(item[0]).join( populate(item[3], data) );
        delimiters.pop();
        var previousDelimiter = delimiters[delimiters.length-1];
        buildPatterns(previousDelimiter.start, previousDelimiter.end);
        fixPattern.lastIndex = 0;
        fixPattern.lastIndex = 0;
      }
      while ((item = innerPattern.exec(string)) !== null) {
        string = string.split(item[0]).join( populate(item[2],getValue(data,item[1])) );
        innerPattern.lastIndex = 0;
      }
      while ((item = loopPattern.exec(string)) !== null) {
        var array = [];
        var loopableElement = getValue(data,item[2])[item[1]];
        if (loopableElement !== undefined) {//} && loopableElement.forEach) {
          var loopCount = loopableElement.length;
          for (var i = 0; i < loopCount; i++) {
            var value = loopableElement[i];
            if (typeof value === 'object' && typeof item[4] !== 'undefined') {
              value[item[4]] = i;
            }
            array[i] = populate(item[5],value);
          }
          string = string.split(item[0]).join( array.join(''));
        } else {
          string = string.split(item[0]).join( '' );
        }
        loopPattern.lastIndex = 0;
      }
      while ((item = ifNotPattern.exec(string)) !== null) {
        string = string.split(item[0]).join( (getValue(data,item[1])===false) ? item[2] : '' );
        ifNotPattern.lastIndex = 0;
      }
      while ((item = ifPattern.exec(string)) !== null) {
        string = string.split(item[0]).join( (getValue(data,item[1])===true) ? item[2] : '' );

        ifPattern.lastIndex = 0;
      }
      while ((item = stdPattern.exec(string)) !== null) {
        string = string.split(item[0]).join( toString(getValue(data,item[1])));
        stdPattern.lastIndex = 0;
      }
      while ((item = lngPattern.exec(string)) !== null) {
        string = string.split(item[0]).join(translate(item[1]));
        lngPattern.lastIndex = 0;
      }
      return string;
    };

    buildPatterns(delimiters[0].start,delimiters[0].end);

    iTPL.load = load.bind(iTPL);
    iTPL.use = use;
    iTPL.loadLanguage = loadLanguage.bind(iTPL);
    iTPL.appendToLanguage = appendToLanguage.bind(iTPL);
    iTPL.setLocale = setLocale.bind(iTPL);
    iTPL.getLocale = getLocale.bind(iTPL);
    iTPL.translate = translate.bind(iTPL);
    iTPL.list = list.bind(iTPL);
    iTPL.render = this.isNodeJS ? populate.bind(iTPL) : render.bind(iTPL);

    if (this.isNodeJS) {
      module.exports = iTPL;
    } else {
      this.EVT.subscribe("window.onload",(function refreshAndStartObserver() {
        this.ELM.per('[data-template]:not([data-template=""]').useAsTemplate();
      }).bind(this));
    }

    return iTPL;
  }).call(this);

  return this;}).call((typeof O != "undefined")?O:{});
