import { readFileSync } from 'fs';
import { Errors } from 'groundup';

function getUpdatesFile () {
  const versionFile = './versions.json';

  try {
    return JSON.parse(readFileSync(versionFile, 'utf-8'));
  } catch(err) {
    throw new Errors.Custom('Read DB version file',versionFile,err);
  }
}

function updateDB(db) {
  if (typeof db !== 'object') {
    throw new Errors.MissingInput('dbUpdate must get the db.driver object');
  }

  return db.query('PRAGMA user_version', { type: sequelize.QueryTypes.SELECT})
    .then(data => {
      const dbVersion = +data[0].user_version,
        versions = getUpdatesFile();
      var tasks = [];
    
      versions.forEach (version => {
        if (version.id > dbVersion) {
          tasks = tasks.concat(version.queries);
        }
      });
    
      if (tasks.length > 0) {
        tasks.push('PRAGMA user_version = ' + versions.pop().id);

        return db.execQuery(tasks.shift(), executeNextTask.bind({}, db, callback, tasks));
      }

      return true;
    });
}

export default updateDB;