(function attachmentControllerClosure() {
  'use strict';

  var guid = require('../helpers/db/Guid.js'),
      controllers = {};

  function setControllers(controllerMap) {
    controllers = controllerMap;
  }

  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function get(attachmentId, files, callback) {
    files.get(getImageFilename(attachmentId), function(img) {
      if (img instanceof Error) {
        callback({ _status: 404 });
      } else {
        callback({ _file: 'image/png', content: img });
      }
    });
  }

  function getImageFilename(attachmentId) {
    return 'attach-' + attachmentId + '.png';
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set(images, files, post) {
    var image, fileId, filename, i, count, added, removed, postImages;

    if (images === undefined) {
      return false;
    }

    added = images.added;
    removed = images.removed;
    postImages = post.images || [];

    if ((removed.length + added.length) === 0) {
      return false;
    }

    removed.forEach(function perImage(image) {
      files.set(getImageFilename(image), undefined);
      postImages.splice(postImages.indexOf(image), 1);
    });

    added.forEach(function perImage(image) {
      do {
        fileId = guid(6);
        filename = getImageFilename(fileId);
      } while (files.exists(filename));
      files.set(filename, image);
      postImages.push(fileId);
    });

    post.images = postImages; // in case it was originally null;

    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  exports.get = get;
  exports.set = set;

})();
