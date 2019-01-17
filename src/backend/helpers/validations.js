import marked from 'marked';
import { Errors } from 'groundup';

const emailPattern = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]' +
                          '{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))',
    maskedIdPattern  = '([\\w\\d\\-]+)',
    urlParamPattern = new RegExp('\\[([^#]+?)\\]', 'g'),
    tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*',
    tagOrComment = new RegExp('<(?:' + '!--(?:(?:-*[^->])*--+|-?)' + '|script\\b' + tagBody +
      '>[\\s\\S]*?</script\\s*' + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*' + '|/?[a-z]' + ')>', 'gi');

function toText(string) {
  // convert to markDown + remove all html tags + split connected words
  return marked((string || '').trim())
                              .replace(/<(?:.|\n)*?>/gm, '')
                              .replace(/[^(\s\w)]+/gm, ' ')
                              .replace(/\n$/, '');
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Validations {
  isValidEmail(email) {
    if (email.match(emailPattern)) {
      return true;
    }
  }

  isValidPassword(password) {
    return (password || '').length > 0;
  }

  isValidStringLength(key, value, minLength, maxLength, isRequired = false) {
    if (value === undefined && isRequired) {
      return new Errors.MissingInput(key);
    } else if (value < minLength) {
      return new Errors.TooShort(key, value);
    } else if (value > maxLength) {
      return new Errors.TooLong(key, value);
    }

    return true;
  }

  isValidEntityName(value) {
    return (value && value.match(/[\s@#]/) === null) ? true : new Errors.BadInput(key, value);
  }

  sanitizeString(string) {
    if (string === undefined) {
      return '';
    }

    return string.replace(tagOrComment, '').replace(/<(?:.|\n)*?>/gm, '');
  }

  countWords(string) {
    return toText(string).replace(/\s+/g, ' ').replace(/\s$/, '').split(' ').length;
  }

  countCharacters(string) {
    return toText(string).length;
  }

  isPostLengthOK(message, compareTo) {
    if (compareTo) {
      return (compareTo >= 0 ? countWords(message) : countCharacters(message)) <= Math.abs(compareTo);
    }

    return true;
  }
}

const validations = new Validations();

export { validations as default, emailPattern, maskedIdPattern, urlParamPattern };
