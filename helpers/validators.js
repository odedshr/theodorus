(function validatorsClosure() {
    'use strict';

    var emailPatternString = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))';
    var maskedIdPattern  = '([\\w\\d]*)';
    var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
    var tagOrComment = new RegExp(
        '<(?:'
            // Comment body.
        + '!--(?:(?:-*[^->])*--+|-?)'
            // Special "raw text" elements whose content should be elided.
        + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
        + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
            // Regular name
        + '|/?[a-z]'
        + tagBody
        + ')>',
        'gi');

    function isValidEmail (username) {
        if (username.match(emailPatternString)) {
            return true;
        }
    }

    function isValidPassword (password) {
        return password && password.length>0;
    }

    function isValidCommunityName (name) {
        return name && name.length>0;
    }

    function sanitizeString (string) {
        return string.replace(tagOrComment, '');
    }

    function textify (string) {
        string = string.replace(/<(?:.|\n)*?>/gm, ''); //strip html tags
        string = string.replace(/[^(\s\w)]+/gm, ' '); // split connected words
        return string;
    }

    function countWords (string) {
        return textify(string).match(/\S+/g).length;
    }

    function countCharacters (string) {
        return textify(string).length;
    }

    exports.emailPatternString = emailPatternString;
    exports.maskedIdPattern = maskedIdPattern;
    exports.isValidEmail = isValidEmail;
    exports.isValidPassword = isValidPassword;
    exports.isValidCommunityName = isValidCommunityName;
    exports.sanitizeString = sanitizeString;
    exports.countWords = countWords;
    exports.countCharacters = countCharacters;
})();