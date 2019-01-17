import userController from '../controllers/user.controller.js';

export default {
  '/user/connect': { post: userController.connect },
  '/user/connect/[token:string]': { get: userController.authenticate },
  '/user': {
    get: userController.get,
    post: userController.set
  }
}
