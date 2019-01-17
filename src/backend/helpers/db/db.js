import mysql from 'mysql2';
import { Errors } from 'groundup';
import UserDB from './user.db';
class Transaction {
  constructor(connectionSettings) {
    this.connection = mysql.createConnection(connectionSettings);
  }

  query(query) {
    return new Promise((resolve, reject) => {
      this.connection.query(query, (err, results, fields) => (err ? reject(err) : resolve({ results, fields})));
    });
  }

  end() {
    this.connection.close();
  }
}
class DB {
  constructor(connectionSettings) {
    if (connectionSettings === undefined) {
      throw new Errors.MissingInput('connectionSettings');
    }
    this.connectionSettings = connectionSettings;
    this.user = new UserDB(this);
    this.getTablesSpecs([this.user]);
  }

  getTablesSpecs(models) {
    const tableNames = models.map(model => `"${model.table}"`).join(','),
      modelByTableName = models.reduce((map, model) => {
        map[model.table] = model;
        return map;
      }, {});

    return this.query(
      `SELECT table_name, column_name, is_nullable, column_type, column_comment
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name IN (${tableNames})
      AND table_schema = "${this.connectionSettings.database}";`
    )
    .then(({ results }) => results.forEach(row => {
      modelByTableName[row.table_name].defineColumn(row.column_name, row);
    }))
    .catch(err => console.trace(err));
  }

  withTransaction(action) {
    let transaction;
    return new Promise(resolve => resolve())
      .then(() => { transaction = new Transaction(this.connectionSettings); })
      .then(() => action(transaction))
      .then(() => transaction.end());
  }

  query(query, existingConnection) {
    return new Promise((resolve, reject) => {
      const connection = existingConnection ? existingConnection : mysql.createConnection(this.connectionSettings);
      connection.query(query, (err, results, fields) => {
        if (!existingConnection) {
          connection.close();
        }
        if (err) {
          err.query = query;
          return reject(err);
        }
        resolve({ results, fields});
      });
      ;
    });
  }

  insert(table, dataObject, columns, existingConnection) {
    const keys = Object.keys(dataObject),
      values = keys.map(key => `${this.formatValue(dataObject[key], columns[key])}`),
      query = `INSERT INTO ${table} (ID, ${keys.join(',')}) VALUES (uuid(), ${values.join(',')});`

    return this.query(query, existingConnection);
  }

  update(table, dataObject, columns, existingConnection) {
    const values = Object
      .keys(dataObject)
      .map(key => (key!==id) ? `${key} = ${this.formatValue(dataObject[key], columns[key])}` : undefined),
      query = `UPDATE INTO ${table} SET (${values.join(',')}) WHERE ID="${dataObject.id}";`
    
    return this.query(query, existingConnection);
  }

  formatValue(value, column = {}){
    switch (column.type) {
      case 'datetime':
        return `"${value.toJSON().slice(0, 19).replace('T', ' ')}"`;
      default:
        return typeof value === 'string' ? `"${value}"` : value; 
    }
  }
}

export default DB;
