import membershipController from '../controllers/membership.controller.js';

export default {
  '/community/[id]/membership': {
    get: membershipController.list,
    put: membershipController.set,
    delete: membershipController.archive
  },
  '/membership': {
    get: membershipController.list
  },
  '/membership/exists': {
    post: membershipController.exists
  },
  '/membership/[id]': {
    get: membershipController.get,
    post: membershipController.set,
    delete: membershipController.archive
  }
};