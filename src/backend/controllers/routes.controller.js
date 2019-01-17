import routes from '../routes/routes.js';
import Context from '../helpers/Context.js';
import FileManager from '../helpers/FileManager.js';
import Mailer from '../helpers/Mailer.js';
import forEach from '../helpers/forEach.js';
import DB from '../helpers/db/db.js';

class RoutesController {
  constructor(config) {
    this.db = new DB(config.dbConnectionObject);
    this.fileManager = new FileManager(config.storedFilesFolder),
    this.mailer = new Mailer(config, this.fileManager);
    this.contexts = [];

    routes[''] = { get: this.api };

    forEach(routes, (url, types) => {
      forEach(types, (type, handler) => {
        this.contexts.push(new Context(url, type, handler, this.db, this.fileManager, this.mailer));
      });
    });
  }
  
  forEach(delegate) { 
    forEach(routes, (url, restMethods) => {
      forEach(restMethods, (restMethod, handler) => {
        const context = new Context(url, handler, fileManager, mailer);
  
        delegate(restMethod, context.getURL(), context.getHandler());
      });
    });
  }

  api() {
    const version = process.env.npm_package_version;

    return {
      title: 'Theodorus REST API',
      version,
      schemes: ['https'],
      produces: ['application/json'],
      routes
    };
  }

  getContexts() {
    return this.contexts;
  }
}

export default RoutesController;
