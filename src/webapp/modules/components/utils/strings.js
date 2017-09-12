/* global marked, appName */
;(function stringsEnclosure(scope) {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function countWords(string) {
    var markDownString = mdToText(string);

    return markDownString.length ? markDownString.split(' ').length : 0;
  }

  function countCharacters(string) {
    return mdToText(string).length;
  }

  function mdToText(string) {
    // convert to markDown + remove all html tags + split connected words
    return marked((string || '').trim())
                                .replace(/<(?:.|\n)*?>/gm, '')
                                .replace(/[^(\s\w)]+/gm, ' ')
                                .replace(/\n$/, '');
  }

  function mdToHtml(string) {
    return marked(string).replace(/(^|\W)(#[a-z\d][\w-]*)/ig, '$1<span class="markDown-tag">$2</span>');
  }

  function toTitle(postType) {
    return postType.substr(0, 1).toUpperCase() + postType.substr(1);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function Strings() {}

  Strings.prototype = {
    countWords: countWords,
    countCharacters: countCharacters,
    mdToText: mdToText,
    mdToHtml: mdToHtml,
    toTitle: toTitle,
  };

  scope.strings = new Strings();
})(window[appName] || module.exports);
