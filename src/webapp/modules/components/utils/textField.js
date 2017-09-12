/* global appName */
;(function textFieldEnclosure(scope) {
  'use strict';

  /*  in html:
      <div data-max-length="-140"><textarea name="fieldName">markedDownText</textarea></div>

      data-max-length
      - negative value is characters (-10 = 10 characters)
      - positive value is words (10 = 10 words)

      init in js:
      scope.ui.textField.init(document.getElementById('postContent'));
  */

  function textField() {}

  textField.prototype = {
    init: function init(dElm) {
      var dCounter = dElm.closest('[data-max-length]');

      if (dCounter !== undefined) {
        dElm.onkeyup = this._contentUpdated.bind(this, dElm, dCounter);
        dCounter.classList.add('text-field');
      } else {
        throw scope.error.badInput('textField', dElm);
      }

      this._contentUpdated(dElm, dCounter);
    },

    getLengthString: function getLengthString(content, maxLength) {
      if (maxLength > 0) {
        return (scope.strings.countWords(content) + '/' + Math.abs(maxLength) + ' ' +
                scope.template.translate('label.words'));
      } else {
        return (scope.strings.countCharacters(content) + '/' + Math.abs(maxLength) + ' ' +
                scope.template.translate('label.characters'));
      }
    },

    _contentUpdated: function onContentUpdated(dElm, dCounter) {
      var value = dElm.value,
          maxLength = +dCounter.getAttribute('data-max-length') || 0,
          isCountingWords = (maxLength >= 0),
          newValue = isCountingWords ? scope.strings.countWords(value) : scope.strings.countCharacters(value),
          errorMessage = false;

      maxLength = Math.abs(maxLength);

      dCounter.setAttribute('data-count', newValue + '/' + maxLength + ' ' +
        scope.template.translate((isCountingWords ? 'unit.word' : 'unit.character') + (maxLength > 1 ? 's' : '')));

      if (maxLength && (newValue > maxLength)) {
        errorMessage = scope.template.translate('error.tooLong');
        dCounter.setAttribute('data-error', errorMessage);
        dElm.setCustomValidity(errorMessage);
      } else {
        dCounter.removeAttribute('data-error');
        dElm.setCustomValidity('');
      }

      return dElm.validity.valid;
    }
  };

  scope.onReady(function() {
    scope.ui.add(textField);
  });

})(window[appName]);
