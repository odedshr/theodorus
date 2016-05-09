;(function dbClosure() {
  'use strict';

  var orm = require('orm');

  var guid = require('../helpers/Guid.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var log = require('../helpers/logger.js');

  var guidLength = 2;
  var findGuidAttemps = 10;

  function setModels(db, models, callback) {
    tryCatch(function tryCatchSetModels() {
      var model, modelRelations = {};
      var srcModels = require('../helpers/models.js');
      var keys = Object.keys(srcModels);
      while (keys.length) {
        model = srcModels[keys.pop()];
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

  function useExpress(connectionString, guidSectionCount) {
    if (guidSectionCount) {
      guidLength = guidSectionCount;
    }

    return orm.express(connectionString, {
      define: setModels
    });
  }

  function connect(connectionString, guidSectionCount, callback) {
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

  function setDBItem(table, item, callback, attempts) {
    if (item.id && item.save) {
      item.save (callback);
    } else {
      if (attempts > findGuidAttemps) {
        guidLength++;
      }
      var id = guid(guidLength);
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