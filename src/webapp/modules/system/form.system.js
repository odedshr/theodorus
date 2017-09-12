// ccSpell:words describedby
/* global appName */
;(function formEnclosure(scope) {
  'use strict';

  // TODO: incorporate code from https://bitsofco.de/form-validation-techniques/

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function isFormFieldDirty(dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked !== dElm.defaultChecked;
      case 'radio': return dElm.checked !== dElm.defaultChecked;
      case 'select-one': return !dElm.options[dElm.selectedIndex].defaultSelected;
      default:
        return dElm.value !== dElm.defaultValue;
    }
  }

  function getFormFieldValue(dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked;
      case 'radio': return dElm.checked ? dElm.value : undefined;
      case 'select-one': return !dElm.options[dElm.selectedIndex].value;
      default:
        return dElm.value;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function Form() {}

  Form.prototype = {
    setValidationMessage: function setValidationMessage(dField, message) {
      var errorField;

      dField.setCustomValidity(message);
      errorField = document.getElementById(dField.getAttribute('aria-describedby'));

      if (errorField) {
        errorField.innerHTML = message;
      }
    },

    getDirtyFields:   function getDirtyFormFields(formElement) {
      return this.getFormFields(formElement, true);
    },

    getFields: function getFormFields(formElement, onlyDirty) {
      var value, data = {},
          errors = [];

      Array.from(formElement.elements).forEach(function perElement(dElm) {
        if (dElm.name && dElm.name.length > 0 && (!onlyDirty || isFormFieldDirty(dElm))) {
          if (!dElm.validity.valid ||
              (typeof dElm.checkValidation === 'function' && dElm.checkValidation() === false)) {
            errors.push(element);
          } else if (dElm.name && dElm.name.length > 0) {
            value = getFormFieldValue(dElm);

            if (value !== undefined) {
              data[dElm.name] = value;
            }
          }
        }
      });

      if (errors.length > 0) {
        throw scope.error.badInput('validation-errors', errors);
      }

      return data;
    }
  };

  scope.form = new Form(scope);

})(window[appName] || module.exports);
