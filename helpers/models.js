;(function modelsClosure () {
  'use strict';

  var iterateFiles = require('../helpers/iterateFiles.js');
  var modelsFolder = './models';
  var models = {};

  iterateFiles (modelsFolder, function perModel(model) {
    var count;

    if (model.name && model.schema) {
      models[model.name] = model;
    } else if (Array.isArray(model)) {
      count = model.length;
      while (count--) {
        var subModel = model[count];
        if (subModel.name && subModel.schema) {
          models[subModel.name] = subModel;
        }
      }
    }
  });

  module.exports = models;
})();