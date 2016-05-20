app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  //==================================/
  function isFormFieldDirty (dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked !== dElm.defaultChecked;
      case 'select-one': return !dElm.options[dElm.selectedIndex].defaultSelected;
      default:
        return dElm.value !== dElm.defaultValue;
    }
  }

  function getFormFieldValue (dElm) {
    switch (dElm.type) {
      case 'checkbox': return dElm.checked;
      case 'select-one': return !dElm.options[dElm.selectedIndex].value;
      default:
        return dElm.value;
    }
  }

  this.getFormFields = (function getFormFields (formElement, onlyDirty) {
    var formFields = formElement.elements;
    var data = {};
    var errors = [];
    for (var field in formFields) {
      if (formFields.hasOwnProperty(field)) {
        var dElm = formFields[field];
        if (dElm.name && dElm.name.length > 0 && !onlyDirty || isFormFieldDirty(dElm)) {
          if (typeof dElm.checkValidation === 'function' && dElm.checkValidation() === false) {
            errors.push(element);
          } else if (dElm.name && dElm.name.length > 0) {
            data[dElm.name] = getFormFieldValue(dElm);
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
