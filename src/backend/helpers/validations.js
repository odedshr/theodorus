(function validationsClosure() {
  'use strict';
  var marked = require('marked'),
      Errors = require('../helpers/Errors.js'),

      emailPatternString = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]' +
                           '{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))',
      maskedIdPattern  = '([\\w\\d\\-]+)',
      urlParameterPattern = new RegExp('\\[([^#]+?)\\]', 'g'),
      tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*',
      tagOrComment = new RegExp('<(?:' + '!--(?:(?:-*[^->])*--+|-?)' + '|script\\b' + tagBody +
        '>[\\s\\S]*?</script\\s*' + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*' + '|/?[a-z]' + ')>', 'gi');

  function isValidEmail(username) {
    if (username.match(emailPatternString)) {
      return true;
    }
  }

  function isValidPassword(password) {
    return (password || '').length > 0;
  }

  function isValidStringLength(key, value, isRequired, minLength, maxLength) {
    if (value === undefined && isRequired) {
      return Errors.missingInput(key);
    } else if (value < minLength) {
      return Errors.tooShort(key, value);
    } else if (value > maxLength) {
      return Errors.tooLong(key, value);
    }

    return true;
  }

  function isValidEntityName(key, value) {
    return (value && value.match(/[\s@#]/) === null) ? true : Errors.badInput(key, value);
  }

  function sanitizeString(string) {
    if (string === undefined) {
      return '';
    }

    return string.replace(tagOrComment, '').replace(/<(?:.|\n)*?>/gm, '');
  }

  function toText(string) {
    // convert to markDown + remove all html tags + split connected words
    return marked((string || '').trim())
                                .replace(/<(?:.|\n)*?>/gm, '')
                                .replace(/[^(\s\w)]+/gm, ' ')
                                .replace(/\n$/, '');
  }

  function countWords(string) {
    return toText(string).replace(/\s+/g, ' ').replace(/\s$/, '').split(' ').length;
  }

  function countCharacters(string) {
    return toText(string).length;
  }

  function isPostLengthOK(message, compareTo) {
    if (compareTo) {
      return (compareTo >= 0 ? countWords(message) : countCharacters(message)) <= Math.abs(compareTo);
    }

    return true;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  exports.emailPatternString = emailPatternString;
  exports.maskedIdPattern = maskedIdPattern;
  exports.urlParameterPattern = urlParameterPattern;
  exports.isValidEmail = isValidEmail;
  exports.isValidPassword = isValidPassword;
  exports.isValidStringLength = isValidStringLength;
  exports.isValidEntityName = isValidEntityName;
  exports.sanitizeString = sanitizeString;
  exports.countWords = countWords;
  exports.countCharacters = countCharacters;
  exports.isPostLengthOK = isPostLengthOK;
})();
