;(function dbClosure() {
  'use strict';

  var orm = require('orm');
  var iterateFiles = require('../helpers/iterateFiles.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var modelsFolder = './models';
  var log = require('../helpers/logger.js');

  var guidLength = 2;
  var findGuidAttemps = 10;

  function guid () {
    var count = guidLength;
    var parts = [];
    while (count--) {
      parts[count] = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return parts.join('-');
  }

  function setModels (db, models, callback) {
    tryCatch(function tryCatchSetModels() {
      var modelRelations = {};
      iterateFiles (modelsFolder, function perModel(model) {
        if (model.name && model.schema) {
          try {
            models[model.name] = db.define(model.name, model.schema, {
              methods: model.methods,
              validations: model.validations
            });
            models[model.name].model = model;
            models[model.name].set = setDBItem.bind(null, models[model.name]);
          } catch (err) {
            log(err);
            log(model.name+': '+ JSON.stringify(model.schema));
          }
          if (model.relations) {
            modelRelations[model.name] = model.relations;
          }
        }
      });

      //all models are defined, connect relations between them:
      var modelWithRelations = Object.keys(modelRelations);
      while (modelWithRelations.length > 0) {
        var modelName = modelWithRelations.pop();
        modelRelations[modelName](models[modelName], models);
      }

      db.sync(function dbSynced(err) {
        if (err) {
          throw err;
        } else if (callback !== undefined) {
          callback();
        }
      });
    }, function (err) {
      log(err);
      callback();
    });
  }

  function useExpress (connectionString, guidSectionCount) {
    if (guidSectionCount) {
      guidLength = guidSectionCount;
    }

    return orm.express(connectionString, {
      define: setModels
    });
  }

  function connect (connectionString, guidSectionCount, callback) {
    if (guidSectionCount) {
      guidLength = guidSectionCount;
    }

    orm.connect(connectionString,function connected (err, db) {
      var models = {};
      setModels(db, models, function gotModels (){
        callback(models);
      });
    });
  }

  function setDBItem (table, item, callback, attempts) {
    if (item.id && item.save) {
      item.save (callback);
    } else {
      if (attempts > findGuidAttemps) {
        guidLength++;
      }
      var id = guid();
      table.get(id, checkIdAvailability.bind(null, id, table, item, callback, attempts));
    }
  }

  function checkIdAvailability (id, table, item, callback, attempts, error, response) {
    if (error && error.literalCode === 'NOT_FOUND') {
      item.id = id;
      table.create (item, callback);
    } else {
      setDBItem (table, item, callback, ((attempts ? attempts : 0)+1));
    }
  }

  module.exports.useExpress = useExpress;
  module.exports.setModels = setModels;
  module.exports.connect = connect;
})();