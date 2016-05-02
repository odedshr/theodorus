app = (typeof app !== 'undefined') ? app : {};
(function initEnclosure() {
  /*jshint validthis: true */
  'use strict';
  var loadingInProgress = 0;

  this.registry = this.registry || {};
  this.state = this.state || {};

  this.registry.appContainer = { preprocess : (function registerAppContainer (dElm, callback) {
    document.title = O.TPL.translate('app.title');
    this.state = this.extend (this.state, this.getMappedArguments ());
    var isAuthenticated = this.isAuthenticated ();
    var bindedCallback = callback.bind (callback,{
      showUserDetailsInHeader: isAuthenticated,
      pageTemplate : this.getPageTemplateName()
    });
    if ( isAuthenticated ) {
      this.api.getUser (gotUser.bind(this, bindedCallback));
    } else {
      bindedCallback ();
    }

  }).bind(this) };

  function gotUser (callback, response) {
    this.state.user = response.user;
    callback ();
  }

  //===========================================================================/
  function onCancelButtonClicked () {
    history.back();
    return false;
  }
  this.registry.btnCancel = { attributes : { onclick : onCancelButtonClicked } };

  //===========================================================================/
  function onAttributeUpdateClicked (attribute, callback, evt) {
    var dElm = evt.target.closest('[data-register]');
    var subject = dElm.closest('.js-item[data-type][data-id]');
    if (dElm.getAttribute('data-value') === 'true') {
      attribute = 'un' + attribute;
    }
    this.api.setAttribute(subject.getAttribute('data-type'),
                          subject.getAttribute('data-id'),
                          attribute,
                          onAttributeUpdate.bind(this,dElm, callback));
  }

  function onAttributeUpdate (dElm, callback, output) {
    dElm.setAttribute('data-value',output.value);
    var dCount = O.ELM[''.concat(output.subjectType,'_',output.subjectId,'_',output.attribute,'_count')];
    if (dCount !== undefined) {
      dCount.innerHTML = output.count;
    }
    if (callback) {
      callback(dElm, output);
    }
  }

  this.registry.endorse = { attributes : { onclick : onAttributeUpdateClicked.bind(this, 'endorse', this.simplyReturn ) } };
  this.registry.follow = { attributes : { onclick : onAttributeUpdateClicked.bind(this, 'follow', this.simplyReturn ) } };
  this.registry.read = { attributes : { onclick : onAttributeUpdateClicked.bind(this, 'read', this.simplyReturn ) } };

  //===========================================================================/
  function registerPageNotFound (dElm, callback) {
    document.title = O.TPL.translate('title.pageNotFound');
    callback ({ isAuthenticated : this.isAuthenticated() });
  }
  this.registry.notFoundPage = { preprocess : registerPageNotFound.bind(this)} ;

  this.registry.frmPageNotFound = { attributes : { onsubmit : onPageNotFoundSubmitted } };
  this.registry.pageNotFoundURL = { attributes : { value : window.location.hash } };
  function onPageNotFoundSubmitted () {
    this.log ('not yet implemented', this.logType.error);
    return false;
  }
  //===========================================================================/

  this.isAuthenticated = (function isAuthenticated () {
    var token = O.COOKIE('authToken');
    return (token.length > 0);
  }).bind(this);

  this.updateURL = (function updateURL (hash) {
    history.pushState({}, hash, location.href.split('#')[0]+'#'+ hash);
    this.renderPage();
  }).bind(this);

  this.getPageTitleFromHash = (function getPageFromHash (hashData) {
    if (hashData.length) {
      var page = hashData[0].key;
      for (var i = 1; i < hashData.length; i++) {
        var word = hashData[i].key;
        page += ' '+ word.substr(0,1).toUpperCase() + word.substr(1);
      }
      return page;
    }
    return '';
  }).bind(this);

  this.getPageTemplateName = (function getPageTemplateName () {
    var data = {};
    var hashData = this.extractArgumentsFromLocationHash();
    var title = this.getPageTitleFromHash(hashData);
    var pageTemplate = (title.length ? title.replace(/\s/g,'') : (this.isAuthenticated() ? 'home' : 'welcome'))+'Page';
    O.ELM.appContainer.setAttribute('data-section',hashData.length > 0 ? hashData[0].key : 'home');
    if (O.TPL.list().indexOf(pageTemplate) === -1) {
      var registryAction = this.registry[pageTemplate];
      if (registryAction !== undefined && registryAction.preprocess !== undefined) {
        registryAction.preprocess(null, function () {});
      } else {
        this.log('trying to access ' + pageTemplate,this.logType.debug);
        pageTemplate = "notFoundPage";
      }
    }
    return pageTemplate;
  }).bind(this);

  this.renderPage = (function renderPage () {
    var pageTemplate = this.getPageTemplateName();

    this.state = this.extend(this.state, this.getMappedArguments());

    O.ELM.pageContainer.setAttribute('data-register', pageTemplate);
    this.register(O.ELM.pageContainer);
  }).bind(this);
  window.onhashchange = this.renderPage.bind(this);

  //==========================

  this.registry.archive = { attributes : { onclick : archive.bind(this)}};

  function archive (evt) {
    var dArchiveButton = evt.target.closest('[data-register="archive"]');
    if (dArchiveButton) {
      var type = dArchiveButton.getAttribute('data-type');
      var id = dArchiveButton.getAttribute('data-id');
      this.api.archive(type, id, onArchived.bind(this,type, id));
    } else {
      this.log('failed to find archive button',this.logType.debug);
      this.log(dArchiveButton,this.logType.debug);
    }

  }

  function onArchived (type, id) {
    var parentNode;
    if (type==='topic') {
      parentNode = O.ELM[type+'-'+id];
    } else {
      parentNode = O.ELM[type+'-'+id].parentNode.closest('.js-item[data-id][data-type]');
      if (this.updateCount(parentNode, type ,-1)) {
        if (type !== 'opinion') {
          O.DOM.remove(O.ELM[type+'-'+id]);
        } else {
          parentNode.querySelector('.js-opinion-content').value = '';
          parentNode.querySelector('.attribute.time').innerHTML = '';
        }
      }
    }

    this.register(parentNode.closest('.js-list'));
  }

  this.removeArchiveButton = function removeArchiveButton(type, id) {
    var dArchiveButton = document.querySelector(''.concat('[data-register="archive"][data-type="', type, '"][data-id="', id, '"]'));
    if (dArchiveButton) {
      O.DOM.remove(dArchiveButton);
    }
  };

  //==========================

  this.registry.toggle = { attributes : { onclick : toggle.bind(this)}};

  function toggle (evt) {
    var toggler = evt.target.closest('[data-register]');
    var dElm = O.ELM[toggler.getAttribute('data-target')];
    if (dElm.getAttribute('data-hidden') === 'true') {
      O.CSS.add(toggler,'toggled');
      dElm.removeAttribute('data-hidden');
      var onToggle = dElm.getAttribute('data-on-toggle');
      if (onToggle) {
        dElm.setAttribute('data-register',onToggle);
        this.register (dElm);
      }
    } else {
      O.CSS.remove(toggler,'toggled');
      dElm.setAttribute('data-hidden','true');
      dElm.removeAttribute('data-register');
    }
  }

  //==========================

  this.updateCount = (function updateCount (dElm, countSubject ,delta) {
    if (dElm) {
      var dCount = dElm.querySelector('[data-role="'+countSubject+'-count"]');
      if (dCount) {
        var value = +dCount.innerHTML + delta;
        dCount.innerHTML = value;
        return value;
      }
    }
    return 0;
  }).bind(this);

  //==========================

  function pong (callback, response) {
    if (O.ELM.connectionError !== undefined) {
      O.DOM.remove(O.ELM.connectionError);
    }
    this.state.username = response.username;
    if (callback) {
      callback();
    }
  }

  this.ping = (function ping (callback){
    this.api.ping(pong.bind(this,callback));
  }).bind(this);

  this.registry.ping = { preprocess: (function registerPingButton (dElm, callback) {
    dElm.onclick = O.EVT.subscribe('ping',this.api.ping.bind(this,pong)).getDispatcher('ping');
    callback();
  }).bind(this) };

return this;}).call(app);
