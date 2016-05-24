app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  //==================================/
  function isFormFieldDirty (dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked !== dElm.defaultChecked;
      case 'radio': return dElm.checked !== dElm.defaultChecked;
      case 'select-one': return !dElm.options[dElm.selectedIndex].defaultSelected;
      default:
        return dElm.value !== dElm.defaultValue;
    }
  }

  function getFormFieldValue (dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked;
      case 'radio': return dElm.checked ? dElm.value : undefined;
      case 'select-one': return !dElm.options[dElm.selectedIndex].value;
      default:
        return dElm.value;
    }
  }

  this.getFormFields = (function getFormFields (formElement, onlyDirty) {
    var formFields = formElement.elements, keys = Object.keys(formElement.elements),
        i = 0, length = keys.length,
        value, data = {},
        errors = [];
    for (; i < length; i++) {
      var dElm = formFields[keys[i]];
      if (dElm.name && dElm.name.length > 0 && !onlyDirty || isFormFieldDirty(dElm)) {
        if (typeof dElm.checkValidation === 'function' && dElm.checkValidation() === false) {
          errors.push(element);
        } else if (dElm.name && dElm.name.length > 0) {
          value = getFormFieldValue(dElm);
          if (value !== undefined) {
            data[dElm.name] = value;
          }
        }
      }
    }
    if (errors.length > 0) {
          var error = new Error('validation-erros');
          error.fields = errors;
          throw error;
    }

    return data;
  }).bind(this);

  this.getDirtyFormFields = (function getFormFields (formElement) {
    return this.getFormFields(formElement, true);
  }).bind(this);

  this.setValidationMessage = (function getFormFields (dField, message) {
    dField.setCustomValidity(message);
    var errorField = O.ELM[dField.id + 'Errors'];
    if (errorField) {
        errorField.innerHTML = message;
    }
  }).bind(this);

  //==================================/

return this;}).call(app);
