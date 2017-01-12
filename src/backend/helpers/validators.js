(function validatorsClosure() {
  /*jshint validthis: true */
  'use strict';
  var marked = require ( 'marked' );

  var Errors = require ( '../helpers/Errors.js' );

  var emailPatternString = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))';
  var maskedIdPattern  = '([\\w\\d\\-]+)';
  var urlParameterPattern = new RegExp('\\[([^#]+?)\\]','g');
  var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
  var tagOrComment = new RegExp('<(?:' + '!--(?:(?:-*[^->])*--+|-?)' + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*' + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*' + '|/?[a-z]' + ')>','gi');
    // Comment body. + Special "raw text" elements whose content should be elided. + Regular name

  function isValidEmail (username) {
    if (username.match(emailPatternString)) {
      return true;
    }
  }

  function isValidPassword (password) {
    return password && password.length>0;
  }

  function isValidStringLength (key, value, isRequired, minLength, maxLength) {
    if (value === undefined && isRequired) {
      return Errors.missingInput(key);
    } else if (value < minLength) {
      return Errors.tooShort(key, value);
    } else if (value > maxLength) {
      return Errors.tooLong(key, value);
    }
    return true;
  }

  function isValidEntityName (key, value) {
    return (value && value.match(/[\s@#]/) === null) ? true : Errors.badInput(key, value);
  }

  function sanitizeString (string) {
    if (string === undefined) {
      return '';
    }
    return string.replace (tagOrComment, '').replace (/<(?:.|\n)*?>/gm, '');
  }

  function textify (string) {
    // convert to markDown + remove all html tags + split connected words
    return string ? marked(string).replace (/<(?:.|\n)*?>/gm, '').replace (/[^(\s\w)]+/gm, ' ') : '';
  }

  function countWords (string) {
    return textify(string).replace(/\s+/g,' ').replace(/\s$/,'').split(' ').length;
  }

  function countCharacters (string) {
    return textify(string).length;
  }

  function isPostLengthOK (message, compareTo) {
    if (compareTo === 0) {
      return true;
    } else {
      var stringSize = compareTo > 0 ? countWords(message) : countCharacters(message);
      return stringSize <= Math.abs(compareTo);
    }
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