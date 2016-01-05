;(function modelsClosure () {
    'use strict';

    var iterateFiles = require('../helpers/iterateFiles.js');
    var modelsFolder = './models';
    var models = {};

    iterateFiles (modelsFolder, function perModel(model) {
        if (model.name) {
            models[model.name] = model;
        }
    });

    module.exports = models;
})();