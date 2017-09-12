;(function dbClosure() {
  'use strict';

  var orm = require('orm'),
      tryCatch = require('../../helpers/tryCatch.js'),
      log = require('../../helpers/logger.js'),
      guid = require('../../helpers/db/Guid.js'),
      guidLength = 2,
      findGuidAttemps = 10;

  function setModels(db, models, callback) {
    require('./dbUpdater.js')(db.driver,
                                   setModelOnceDBIsUpToDate.bind({}, db, models, callback));
  }

  function setModelOnceDBIsUpToDate(db, models, callback) {
    tryCatch(function tryCatchSetModels() {
      var modelRelations = {},
          srcModels = require('../../helpers/models.js');

      Object.keys(srcModels).forEach(function perKey(key) {
        var model = srcModels[key];

        try {
          models[model.name] = db.define(model.name, model.schema, {
            methods: model.methods,
            validations: model.validations
          });
          models[model.name].model = model;
          models[model.name].set = setDBItem.bind(null, models[model.name]);
        } catch (err) {
          log(err);
          log(model.name + ': ' + JSON.stringify(model.schema));
        }

        if (model.relations) {
          modelRelations[model.name] = model.relations;
        }
      });

      //all models are defined, connect relations between them:
      Object.keys(modelRelations).forEach(function perModelRelation(modelName) {
        modelRelations[modelName](models[modelName], models);
      });

      db.sync(function dbSynced(err) {
        if (err) {
          throw err;
        } else if (callback !== undefined) {
          callback();
        }
      });
    }, function(err) {
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

    orm.connect(connectionString, function connected(err, db) {
      var models = {};

      if (err) {
        console.error(err);
        process.exit();
      }

      setModels(db, models, function gotModels() {
        callback(models);
      });
    });
  }

  function setDBItem(table, item, callback, attempts) {
    var id;

    if (item.id && item.save) {
      item.save(callback);
    } else {
      if (attempts > findGuidAttemps) {
        guidLength++;
      }

      id = guid(guidLength);

      table.get(id, checkIdAvailability.bind(null, id, table, item, callback, attempts));
    }
  }

  function checkIdAvailability(id, table, item, callback, attempts, error) {
    if (error && error.literalCode === 'NOT_FOUND') {
      item.id = id;
      table.create(item, callback);
    } else {
      setDBItem(table, item, callback, ((attempts ? attempts : 0) + 1));
    }
  }

  function quickAndDirty(callback) {
    var config = require('../helpers/config.js');

    connect(config('dbConnectionString', true), config('guidLength'), callback);
  }

  module.exports.useExpress = useExpress;
  module.exports.setModels = setModels;
  module.exports.connect = connect;
  module.exports.quickAndDirty = quickAndDirty;
})();
