//cSpell:words guid
import express from 'express';
import { existsSync } from 'fs';
import logger from './helpers/logger.js';
import { colors, Errors } from 'groundup';
import RouteController from './controllers/routes.controller.js';

class WebServer {
  constructor(config) {
    this.config = config;
   
    this.app = express();
    this.routeController = new RouteController(config);

    try {
      // Add headers
      this.app.use(this._setHeaders);
      this.app.use(this._parseRequestBody);

      this.routeController.getContexts().forEach(context => {
        this.app[context.getType()](context.getURL(), context.getHandler())
      })
      
      this.app.use(config.apiUrlPrefix, (req, res, next) => res.status(403).end('403 Forbidden'));

      //this.initWebApp();

      this.app.set('port', this.config.port);
      this.app.set('ip', this.config.ip);

      this.app.listen(this.app.get('port'), this.app.get('ip'), () => {
        logger.info(
          `Node server running ${colors.FgYellow}${this.config.name}${colors.Reset} ` +
          `on ${this.config.ip}:${this.config.port}`
        );

        if (this.config.environment === 'dev') {
          logger.info('using ' + this.config.dbConnectionSafeString);
        }
      });
    } catch (err) {
      logger.error(new Errors.Custom('WebServer:', 'Failed setting app', err));
      logger.error(err);
    }
  }

  initWebApp() {
    let webAppFolder = this.config.webAppFolder;

    if (webAppFolder !== undefined) {
      logger.info('using ' + webAppFolder + ' as web-app');
      this.app.use(express.static(webAppFolder));
    } else {
      logger.error('web-app not available');
    }

    const fallbackFile = process.cwd() + '/' + webAppFolder + '/index.html';

    if (existsSync(fallbackFile)) {
      this.app.use('/', (req, res) => {
        return res.sendFile(fallbackFile);
      });
    } else {
      logger.warn(new Errors.NotFound('fallback-html', fallbackFile));
    }
  }

  _setHeaders(req, res, next) {
    // following code is used for cross-domain access
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods',
                  'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers',
                  'X-Requested-With,content-type,authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
  }

  _parseRequestBody(req,res, next) {
    if(['POST','PUT'].indexOf(req.method) === -1) {
      return next();
    }
  
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      req.body = JSON.parse(body);
      next();
    });
  }
}

export default WebServer;