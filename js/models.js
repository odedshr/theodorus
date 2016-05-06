app = (typeof app !== 'undefined') ? app : {};
(function modelsEnclosure() {
  'use strict';
  var emailPatternString = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))';

  this.models = this.models || {};
  var models = this.models;

  function defaultTrue (value) {
    return true;
  }

  function validateMaskedId (value) {
    return true;
  }

  function validateOptionalId (value) {
    return (value === undefined || validateMaskedId(value));
  }

  //////////////////////////////////////////////////////////////////////////////

  function isPostLengthOK (message, comparedTo) {
    if (comparedTo === 0) {
      return true;
    } else {
      var stringSize = comparedTo > 0 ? countWords(message) : countCharacters(message);
      return stringSize <= Math.abs(comparedTo);
    }
  }

  function countWords (string) {
    var textified = textify(string);
    return textified.length ? textified.split(' ').length : 0;
  }
  this.countWords = countWords;

  function countCharacters (string) {
    return textify(string).length;
  }
  this.countCharacters = countCharacters;

  var mdLinkPattern = new RegExp ('\\((.*?)\\)\\[(.*?)\\]','g');

  function find(pattern, string) {
    pattern.lastIndex = 0;
    return pattern.exec(string);
  }

  function textify (string) {
    // convert to markDown + remove all html tags + split connected words
    return string ? marked(string.trim()).replace (/<(?:.|\n)*?>/gm, '').replace (/[^(\s\w)]+/gm, ' ') : '';
  }

  //////////////////////////////////////////////////////////////////////////////

  models.user = {
    status: {
      enum: { active: "active", suspended: "suspended", archived: "archived"},
      validate: function (value) { return (mode.user.status.enum.indexOf(value) > -1); }
    },
    created: {},
    modified: {},
    lastLogin:  {},
    email: {
      validate: function validateEmail (value) {
        if (value.match(emailPatternString)) {
          return true;
        }
      }
    },
    password: {
      validate: function validatePassword (value) {
        return value && value.length>0;
      }
    },
    birthDate: {},
    isFemale: {}
  };
  models.community = {};
  models.membership = {};
  models.topic = {
    content: {
      validate : function validatTopicContent( value, community) {
        if (!isPostLengthOK(value, community.topicLength)) {
          return new Error('error.tooLong');
        } else if (value.length === 0) {
          return new Error('error.tooShort');
        }
        return  true;
      }
    }
  };
  models.opinion = {
    id: {
      validate : validateOptionalId
    },
    topicId: {
      validate : validateMaskedId
    },
    content: {
      validate : function validatOpinionContent( value, community) {
        return isPostLengthOK(value, community.opinionLength) ? true : new Error('error.tooLong');
      }
    }
  };
  models.comment = {
    id: {
      validate : validateOptionalId
    },
    opinionId: {
      validate : validateMaskedId
    },
    parentId: {
      validate : validateOptionalId
    },
    content: {
      validate : function validatCommentContent( value, community) {
        return isPostLengthOK(value, community.commentLength) ? true : new Error('error.tooLong');
      }
    }
  };
  models.feedback = {
    id: {
      validate : validateOptionalId
    },
    image: {
      validate : defaultTrue
    },
    content: {
      validate : function validatFeedbackContent( value ) {
        return value > 0;
      }
    }
  };

return this;}).call(app);
