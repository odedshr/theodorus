app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};
  this.templates = this.templates || {};

  //==================================/
  this.registerS = (function registerChildren (subElements) {
    for (var i = 0, length = subElements.length; i < length; i++) {
      var dElm = subElements[i];
      if (dElm.style.display !== 'none') {
        this.register(dElm);
      }
    }
  }).bind(this);

  this.registerChildrenOf = (function registerChildrenOf (dElm) {
    this.registerS(dElm.querySelectorAll('[data-register]:not(.js-registered)'));
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
      this.registerChildrenOf(dElm);
    }
    catch (err) {
      this.log({
        error: err,
        element: dElm,
        template: templateName,
        content: content
      },this.logType.debug);
    }
  }

  function register (dElm) {
    var templateName = dElm.getAttribute('data-register');

    if ( templateName === undefined ) {
      templateName = dElm.getAttribute ('id');
    }
    O.CSS.remove(dElm,'register').add (dElm,'registering');

    var component = this.registry[templateName];
    if (component !== undefined) {
      if (component.attributes !== undefined) {
        var attr = component.attributes;
        for (var key in attr) {
          dElm[key] = attr[key];
        }
      }
      if (component.template !== undefined) {
        templateName = component.template;
      }
    }

    if (component === undefined) {
      if (this.templates[templateName] === undefined) {
        throw new Error('cannot register template '+templateName +' (undefined)');
      } else {
        render.call(this, dElm,templateName, {});
      }
    } else if (component.preprocess !== undefined){
      component.preprocess.call(this, dElm, render.bind(this,dElm,templateName));
    }

    O.CSS.remove(dElm,'registering').add(dElm,'registered');
  }
  this.register = register.bind(this);

  this.onWindowResize = (function onWindowResize() {
    this.registerS(O.ELM.per('.js-register'));
  }).bind(this);

  window.onresize = O.EVT.subscribe('window.resize',this.onWindowResize).getDispatcher('window.resize');

return this;}).call(app);
