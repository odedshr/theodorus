(function memberRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/membership/all/images': {
        get: {
          description: 'Return all memberships of current user that have an image',
          response: {'200': {memberships: 'array[memberships]'}},
          handler: controllers.profileImage.list
        }
      },
      '/membership/[membershipId]/image': {
        get: {
          description: 'Get the member profile image',
          parameters: {membershipId: 'id'},
          response: {'200': { image: 'binary' }},
          handler: controllers.profileImage.get
        },
        put: {
          description: 'Set the member profile image',
          parameters: {image: 'base64', membershipId: 'id'},
          response: {'200': {}},
          handler: controllers.profileImage.set
        },
        delete: {
          description: 'Set the member profile image',
          parameters: {image: 'base64', membershipId: 'id'},
          response: {'200': {}},
          handler: controllers.profileImage.archive
        }
      },
      '/attachment/[attachmentId]': {
        get: {
          description: 'Get an attachment file',
          parameters: {attachmentId: 'id'},
          response: {'200': {image: 'binary'}},
          handler: controllers.attachment.get
        }
      }
    };

  };
})();