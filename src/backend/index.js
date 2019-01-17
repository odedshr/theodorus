// cSpell:words minified, webapp, backend
import cluster from 'cluster';
import config from './config.js';
import DB from './helpers/db/db.js';
import dbUpdater from './helpers/db/dbUpdater.js';
import WebServer from './web-server.js';
import logger from './helpers/logger.js';

function startCluster() {
  const workers = [];

  if (cluster.isMaster) {
    dbUpdater(new DB(config.dbAdminConnectionObject));

    // Fork workers.
    for (let i = 0; i < config.cpuNumber; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.error('Worker died', code, signal);
    });
  } else {
    try {
      // Workers can share any TCP connection
      // In this case it is an HTTP server
      workers.push(new WebServer(config));

      logger.info('Worker started');
    } catch (err) {
      logger.error('startCluster', 'starting new Worker', err);
    }
  }
}

startCluster(); 
