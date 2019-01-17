import { readFileSync } from 'fs';
import { Errors } from 'groundup';
import logger from '../logger.js';

function getUpdatesFile () {
  const versionFile = './src/backend/helpers/db/db-versions.json';

  try {
    return JSON.parse(readFileSync(versionFile, 'utf-8'));
  } catch(err) {
    throw new Errors.Custom('Read DB version file', versionFile, err);
  }
}

function executeQueries(transaction, queries) {
  if (queries.length) {
    return transaction
      .query(queries.shift())
      .catch(error => logger.error(error))
      .then(() => executeQueries(transaction, queries));
  }
}

function updateDB(db) {
  const file = getUpdatesFile(),
    checkIfVersionsTableExists = `SELECT *
      FROM information_schema.tables
      WHERE table_schema = '${db.connectionSettings.database}'
      AND table_name = 'versions'
      LIMIT 1;`,
      getLatestVersion = `SELECT max(version) AS version FROM ${db.connectionSettings.database}.versions;`;
  
  let dbVersion = 0;
  return db
    .withTransaction(transaction => 
        transaction
          .query(checkIfVersionsTableExists)
          .then(output => {
              if (output === undefined || output.results.length === 0) {
                return executeQueries(transaction, file[0].queries);
              }

              return transaction.query(getLatestVersion).then(output => {
                dbVersion = output.results[0].version;
              });
            })
          .then(() => {
            let tasks = [];
        
            file.forEach(version => {
              if (version.id > dbVersion) {
                tasks = tasks.concat(version.queries);
              }
            });

            if (tasks.length > 0) {
              tasks.push(`INSERT INTO versions (version) VALUES ("${file.pop().id}}");`);
            }
            
            return executeQueries(transaction, tasks);
          })
      )
      .catch(err => {
        if (err && err.code === 'ECONNREFUSED') {
          logger.error('dbUpdater:Connection refused:', err);
        } else {
          logger.error('dbUpdater:', err)
        }
      });
}

export default updateDB;