/* global appName */
;(function uiSystemEnclosure(scope) {
  'use strict';
  function UI(scope) {
    this.scope = scope;
  }

  UI.prototype = {
    add: function(UIComponent) {
      if (UIComponent.name === undefined) {
        throw this.scope.error.missingInput('template.name', UIComponent);
      } else if (UIComponent.name === 'add') {
        throw this.scope.error.badInput('template.name', UIComponent.name);
      }

      UIComponent.scope = this.scope;
      this[UIComponent.name] = new UIComponent();
    },

    invoke: function invoke(dElm) {
      var template = dElm.getAttribute('data-template');

      if (template === undefined) {
        throw this.scope.error.missingInput('data-template');
      } else if (this[template] === undefined) {
        throw this.scope.error.badInput('data-template', template);
      }

      this[template].init(dElm);
      this.invokeChildren(dElm);
    },

    invokeChildren: function invokeChildren(dElm) {
      dElm.querySelectorAll('[data-template]').forEach(this.invoke.bind(this));
    },

    preventInternalLinksFromReloadingPage: function preventInternalLinksFromReloadingPage(dElm) {
      dElm.querySelectorAll('a[href^="/"]').forEach(function perLink(link) {
        link.onclick = scope.page.goTo.bind(this, link.getAttribute('href'));
      });
    }
  };

  scope.ui = new UI(scope);
})(window[appName]);
