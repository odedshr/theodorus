;(function modelsClosure() {
  'use strict';

  var iterateFiles = require('../helpers/iterateFiles.js'),
      modelsFolder = '../models',
      models = {};

  iterateFiles(modelsFolder, function perModel(model) {
    if (model.name && model.schema) {
      models[model.name] = model;
    } else if (Array.isArray(model)) {
      model.forEach(function perSubModel(subModel) {
        if (subModel.name && subModel.schema) {
          models[subModel.name] = subModel;
        }
      });
    }
  });

  module.exports = models;
})();
