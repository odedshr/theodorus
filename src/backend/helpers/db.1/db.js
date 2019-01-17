import Sequelize from 'sequelize';
import { Errors } from 'groundup';
import dbUpdater from './dbUpdater.js';
import srcModels from '../../models/models.js';
import forEach from '../forEach.js';
import logger from '../logger.js';
import guid from './Guid.js';

function setDBItem(table, item) {
  if (item.id && item.save) {
    return item.save();
  } else {
    item.id = guid();
    return table.create(item);
  }
}
class DB {
  connect(connectionString) {
    if (connectionString === undefined) {
      throw new Errors.MissingInput('connectionString');
    }

    this.sequelize = new Sequelize(connectionString);

    return dbUpdater(this.sequelize.driver).then(() => {
      const modelRelations = {};
  
      forEach(srcModels, (key, model) => {
        const { name, schema, methods, validations } = model
        try {
          const dbModel = this.sequelize.define(name, schema, { methods, validations });

          models[name] = dbModel;
          dbModel.model = model;
          dbModel.set = setDBItem.bind(null, dbModel);
        } catch (err) {
          logger.error(`${name}: ${JSON.stringify(schema)}`, err);
        }
  
        if (model.relations) {
          modelRelations[modelName] = model.relations;
        }
      });
  
      //all models are defined, connect relations between them:
      forEach(modelRelations, (modelName, modelRelation) => modelRelation(models[modelName], models))
  
      return this.sequelize.sync();
    });
  }
}

export default DB;
