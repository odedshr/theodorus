;(function dbClosure() {
    'use strict';

    var orm = require('orm');
    var iterateFiles = require('../helpers/iterateFiles.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var modelsFolder = './models';
    var log = require('../helpers/logger.js');

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
        })
    }

    function useExpress (connectionString) {
        return orm.express(connectionString, {
            define: setModels
        });
    }

    function connect (connectionString, callback) {
        orm.connect(connectionString,function connected (err, db) {
            var models = {};
            setModels(db, models, function gotModels (){
                callback(models);
            });
        });
    }

    module.exports.useExpress = useExpress;
    module.exports.setModels = setModels;
    module.exports.connect = connect;
})();