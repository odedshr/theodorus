/* global appName */
;(function pageSystemEnclosure(scope) {
  'use strict';

  function Page() {
    this.constructor.apply(this, arguments);

    this.add.go = this.go.bind(this);
    this.add.render = this.render.bind(this);
    this.add.goTo = this.goTo.bind(this);

    window.onpopstate = this.add.go;

    return this.add;
  }

  Page.prototype = {
    constructor: function constructor(scope) {
      this.add = this.add.bind(this);
      this.scope = scope;
      this.pages = [];
      this.pageMap = {};
    },

    add: function addPage(Page) {
      var page = new Page(scope),
          url = page.url,
          parameterMatches,
          actually,
          key;

      if (url) {
        while ((parameterMatches = scope.pattern.urlParameter.exec(url)) !== null) {
          key = page.parameters[parameterMatches[1]];

          if (Array.isArray(key)) {
            actually = '([' + key.join('|') + ']+)';
          } else {
            switch (key) {
              case 'id':
                actually = scope.pattern.maskedId;
                break;
              case 'email':
                actually = scope.pattern.email;
                break;
              case 'string':
                actually = '(.+)';
                break;
              case 'integer':
                actually = '(\\d+)';
                break;
              default:
                throw scope.error.badInput(url, key);
            }
          }

          url = url.split(parameterMatches[0]).join(actually);
        }

        page.pattern = new RegExp('^' + url + '\\/?$');

        this.pages.push(page);
      }

      if (page.name) {
        this.pageMap[page.name] = page;
      }
    },

    go: function go() {
      var page;

      if (this.pages.length) {
        page = this._getPage(this._normalizeCurrentUrl());

        if (page) {
          page(page.data);
        } else {
          this.scope.log('This page was not found and I don\'t have notFound page');
        }
      } else {
        this.scope.log('You probably want to define some pages...');
      }
    },

    _normalizeCurrentUrl: function normalizeCurrentUrl() {
      return location.pathname + location.hash.replace(/^#\!?/g, '/') + location.search.replace(/^\?/g, '/');
    },

    pages: function pages() {
      return this.pages;
    },

    _getPage:  function getPage(url) {
      var routeCount = this.pages.length,
          page,
          values,
          key;

      if (!url) {
        url = this.normalizeCurrentUrl();
      }

      while (routeCount--) {
        page = this.pages[routeCount];

        if (url.match(page.pattern)) {
          if (page.parameters && Object.keys(page.parameters).length > 0) {
            page.data = {};
            values = page.pattern.exec(url);
            values.shift(); // values[0] is the entire string
            scope.pattern.urlParameter.lastIndex = 0; // reset regex to be ready to use

            while (values.length > 0 && (key = scope.pattern.urlParameter.exec(page.url))) {
              page.data[key[1]] = values.shift();
            }
          }

          return page;
        }
      }

      return this.pageMap.notFound;
    },

    render: function render(pageId, data) {
      var renderObject = {},
          domElm = document.body;

      renderObject[pageId + 'Page'] = data ? data : {};
      domElm.innerHTML = scope.template.render(renderObject);
      this.scope.ui.invokeChildren(domElm);
    },

    goTo: function goTo(url) {
      history.pushState(undefined, undefined, url);
      this.go();

      return false;
    }
  };

  scope.page = new Page(scope);
})(window[appName] || module.exports);
