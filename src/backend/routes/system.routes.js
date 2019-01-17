import systemController from '../controllers/system.controller.js';

export default {
  '/system/ping': { get: systemController.ping },
  '/system/version': { get: systemController.getVersion }
};
