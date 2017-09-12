/* global window, appName */
;(function templateSystemEnclosure(scope) {
  'use strict';

  var delimiters = [{ start: '{{', end: '}}' }],
      isClientSide = (window !== undefined),
      locale,
      patterns = {
        template: new RegExp('<template data-id="([\\s\\S]+?)">([\\s\\S]+?)</template>', 'g'),
        escape: new RegExp('[\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\$\\|]', 'gm')
        // - /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/gm
      },
      strings = {},
      templates = {},
      template;

  function Template() {
    this.buildPatterns(delimiters[0].start, delimiters[0].end);
  }

  Template.prototype = {
    appendToLanguage: function appendToLanguage(locale, dictionary) {
      var key;

      if (typeof strings[locale] === 'undefined') {
        strings[locale] = {};
      }

      for (key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
          strings[locale][key] = dictionary[key];
        }
      }
    },

    getDefaultLocale: function getDefaultLocale() {
      return (!isClientSide) ? 'en-us' : ((window.navigator.userLanguage || window.navigator.language).toLowerCase());
    },

    getValue: function getValue(dataset, key) {
      var value = false,
          keyAndTemplate = key.split(':'),
          template = keyAndTemplate[1],
          i, nested, subTemplateInfo;

      key = keyAndTemplate[0];

      if (key === '.') {
        value = dataset;
      } else if (dataset === undefined) {
        return undefined;
      } else {
        nested = key.split('.');
        value = dataset.hasOwnProperty(nested[0]) ? dataset[nested[0]] : (nested[0] === '.' ? dataset : '');

        for (i = 1; i < nested.length; i++) {
          value = value.hasOwnProperty(nested[i]) ? value[nested[i]] : '';
        }
      }

      if (template) {
        template = (template.match(patterns.quote)) ? template.replace(/'/g, '') : getValue(dataset, template);
      }

      if (template) {
        subTemplateInfo = {};
        subTemplateInfo[template] = (key === '.') ? value : dataset[key];

        return this.render(subTemplateInfo);
      } else {
        return value;
      }
    },

    buildPatterns: function buildPatterns(start, end) {
      patterns.std = new RegExp(start + '([^#]+?)' + end, 'g');
      patterns.lng = new RegExp(start + '#(.+?)' + end, 'g');
      patterns.if = new RegExp(start + '\\?(.+?)' + end + '([\\s\\S]+?)' + start + '[\\/$]\\1' + end, 'g');
      patterns.ifNot = new RegExp(start + '\\?\\!(.+?)' + end + '([\\s\\S]+?)' + start + '\\/\\1' + end, 'g');
      patterns.loop = new RegExp(start + '([^@}]+?)@([\\s\\S]+?)(:([\\s\\S]+?))?' + end + '([\\s\\S]+?)' +
                                 start + '\\/\\1@\\2' + end, 'g');
      patterns.inner = new RegExp(start + '\\@([\\s\\S]+?)' + end + '([\\s\\S]+?)' + start + '\\/\\1' + end, 'g');
      patterns.fix = new RegExp(start + '\'([^\'}]+?)\',\'([\\s\\S]+?)\'' + end + '([\\s\\S]+?)' +
                                start + '\\/\'\\1\',\'\\2\'' + end, 'g');
      patterns.quote = new RegExp('^\'.*\'$');
    },

    escapeRegExp: function escapeRegExp(string) {
      return string.replace(patterns.escape, '\\$&');
    },

    find: function find(pattern, string) {
      pattern.lastIndex = 0;

      return pattern.exec(string);
    },

    getLocale: function getLocale() {
      return locale;
    },

    list: function list() {
      return Object.keys(templates);
    },

    loadTemplates: function loadTemplates(sUrl, callback) {
      scope.ajax.get(sUrl, this.onTemplatesLoaded.bind(this, callback), { type: 'text' });
    },

    onTemplatesLoaded: function onTemplatesLoaded(callback, templateString) {
      var template;

      while ((template = patterns.template.exec(templateString)) !== null) {
        this.useAsTemplate(template[2], template[1]);
      }

      if (typeof callback === 'function') {
        callback(this.list());
      }
    },

    loadLanguage: function loadLanguage(sUrl, callback) {
      if (isClientSide) {
        scope.ajax.get(sUrl, this.languageLoaded.bind(this, callback), { type: 'json' });
      } else {
        this.languageLoaded(callback, require(sUrl));
      }
    },

    languageLoaded: function languageLoaded(callback, response) {
      var locale;

      for (locale in response) {
        if (response.hasOwnProperty(locale)) {
          this.appendToLanguage(locale, response[locale]);
        }
      }

      if (typeof callback === 'function') {
        callback(Object.keys(response));
      }
    },

    populate: function populate(string, data) {
      var item, delimiter, previousDelimiter, array, loopedElement, i, loopCount, value, loop, indexName;

      while ((item = patterns.fix.exec(string)) !== null) {
        delimiter = { start: this.escapeRegExp(item[1]), end: this.escapeRegExp(item[2]) };
        delimiters.push(delimiter);
        this.buildPatterns(delimiter.start, delimiter.end);
        string = string.split(item[0]).join(this.populate(item[3], data));
        delimiters.pop();
        previousDelimiter = delimiters[delimiters.length - 1];
        this.buildPatterns(previousDelimiter.start, previousDelimiter.end);
        patterns.fix.lastIndex = 0;
      }

      while ((item = this.find(patterns.inner, string)) !== null) {
        string = string.split(item[0]).join(populate(item[2], this.getValue(data, item[1])));
      }

      while ((item = this.find(patterns.loop, string)) !== null) {
        array = [];
        i = 0;
        loop = this.getValue(data, item[2]);
        indexName = item[4];

        if (Array.isArray(loop)) {
          loopedElement = item[1];
          // since we write to the main scope, which may have these variable, we'll back them up
          value = { element: data[loopedElement], idx: data[indexName] };

          for (loopCount = loop.length; i < loopCount; i++) {
            data[loopedElement] = loop[i];
            data[indexName] = i;
            array.push(this.populate(item[5], data));
          }

          string = string.split(item[0]).join(array.join(''));
          // restoring the original values -
          data[loopedElement] = value.element;
          data[indexName] = value.idx;
        } else if (loop !== undefined) {
          loopedElement = loop[item[1]];

          if (loopedElement !== undefined) {//} && loopedElement.forEach) {
            for (loopCount = loopedElement.length; i < loopCount; i++) {
              value = loopedElement[i];

              if (typeof value === 'object' && typeof indexName !== 'undefined') {
                value[indexName] = i;
              }

              array.push(populate(item[5], value));
            }

            string = string.split(item[0]).join(array.join(''));
          } else {
            string = string.split(item[0]).join('');
          }
        } else { //no content for loop
          string = string.split(item[0]).join('');
        }
      }

      while ((item = this.find(patterns.ifNot, string)) !== null) {
        string = string.split(item[0]).join(!this.getValue(data, item[1]) ? item[2] : '');
      }

      while ((item = this.find(patterns.if, string)) !== null) {
        string = string.split(item[0]).join(this.getValue(data, item[1]) ? item[2] : '');
      }

      while ((item = this.find(patterns.std, string)) !== null) {
        string = string.split(item[0]).join(this.toString(this.getValue(data, item[1])));
      }

      while ((item = this.find(patterns.lng, string)) !== null) {
        string = string.split(item[0]).join(this.translate(item[1]));
      }

      return string;
    },

    render: function render(input) {
      var templateName = Object.keys(input)[0];

      if (Object.keys(input).length !== 1) {
        throw scope.error.badInput('cannot render multiple templates!', Object.keys(input).join(', '));
      }

      if (templates[templateName] === undefined) {
        throw scope.error.notFound('template', templateName);
      }

      return this.populate(templates[templateName], input[templateName]);
    },

    setLocale: function setLocale(newLocale) {
      locale = newLocale ? newLocale : this.getDefaultLocale();
    },

    toString: function toString(value) {
      return (typeof value === 'function' ? value() : (typeof value === 'object' ? JSON.stringify(value) : value));
    },

    translate: function translate(value) {
      var translated = strings[locale][value];

      return this.toString((typeof translated !== 'undefined') ? translated : value.substr(value.indexOf('.') + 1));
    },

    useAsTemplate: function useAsTemplate(dElm, id) {
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
        throw new Error('could not determine id for template ' + dElm);
      }
    }
  };

  template = new Template();

  template.load = Template.prototype.loadTemplates.bind(template);
  template.use = Template.prototype.useAsTemplate.bind(template);
  template.loadLanguage = Template.prototype.loadLanguage.bind(template);
  template.appendToLanguage = Template.prototype.appendToLanguage.bind(template);
  template.setLocale = Template.prototype.setLocale.bind(template);
  template.getLocale = Template.prototype.getLocale.bind(template);
  template.translate = Template.prototype.translate.bind(template);
  template.list = Template.prototype.list.bind(template);
  template.render = ((isClientSide) ? Template.prototype.render : Template.prototype.populate).bind(template);

  locale = template.getDefaultLocale();
  strings[locale] = {};

  scope.template = template;
})(window[appName] || module.exports);
