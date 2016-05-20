app = (typeof app !== 'undefined') ? app : {};
(function initEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};
  this.state = this.state || {};
  this.templates = this.templates || {};

  this.onConnectionError = (function onConnectionError () {
    if (O.ELM.connectionError === undefined) {
      this.notify({notifyErrorConnection: {}});
    }
  }).bind(this);

  function getTemplateMap (templates) {
    var map = {};
    for (var i = 0, length = templates.length; i < length; i++) {
      map[templates[i]] = true;
    }
    return map;
  }
  function onComponentLoaded (process) {
    if (!(--process.progress)) {
      this.templates = getTemplateMap(O.TPL.list());
      O.ELM.refresh();
      this.register(O.ELM.appContainer);
    }
  }

  this.init = (function init () {
    var process = { progress : 3 };

    O.EVT.subscribe ('window.onload', onComponentLoaded.bind (this, process))
      .subscribe ('TPL.templatesLoaded', onComponentLoaded.bind (this, process))
      .subscribe ('TPL.languageLoaded', onComponentLoaded.bind (this, process))
      .subscribe ('connection-error',this.onConnectionError);

    O.TPL.load ('templates.html');
    O.TPL.setLocale ('en-us');
    O.TPL.loadLanguage ('i18n/en-us.json');

  }).bind(this);

  this.init();
  return this;}).call(app);
