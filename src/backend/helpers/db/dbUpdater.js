(function dbUpdateEnclosure (){
  'use strict';

  var versions = require('../../helpers/db/versions.json');

  function updatDB(db, callback) {
      if (typeof db !== 'object') {
        throw new Error('dbUpdate must get the db.driver object');
      }

      db.execQuery('PRAGMA user_version', gotDBVersion.bind({}, db, callback));
  }

  function gotDBVersion(db, callback, err, data) {
    if (err) {
      throw err;
    }

    var dbVersion = +data[0].user_version;
    var tasks = [];

    versions.forEach (function perVersion (version) {
      if (version.id > dbVersion) {
        tasks = tasks.concat(version.queries);
      }
    });

    if (tasks.length > 0) {
      tasks.push('PRAGMA user_version = ' + versions.pop().id);
    }

    executeNextTask(db, callback, tasks);
  }

  function executeNextTask (db, callback, tasks)  {
    if (tasks.length > 0) {
      db.execQuery(tasks.shift(), executeNextTask.bind({}, db, callback, tasks));
    } else {
      callback();
    }
  }

  module.exports = updatDB;
})();
