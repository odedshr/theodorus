(function profileImageControllerClosure() {
  'use strict';

  var sergeant = require('../helpers/sergeant.js');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, membershipId, files, db, callback) {
    set (authUser, membershipId, undefined, files, db, callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (authUser, db, callback) {
    sergeant ({
      images : { table:db.membership, load: { userId: authUser.id, hasImage: true}, multiple: {},
        after: listGetImages, finally: sergeant.json}
    }, 'images', callback);
  }

  function listGetImages (data) {
    var images = [];
    var memberships = data.images;
    var count = memberships.length;
    while(count--) {
      images[images.length] = memberships[count].id;
    }
    data.images = images;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (membershipId, files, callback) {
    files.get(membershipId+'.png', function (img) {
      if (img instanceof Error) {
        callback( { _status: 404 });
      } else {
        callback({ _file: 'image/png', content: img });
      }
    });
  }

  function set (authUser, membershipId, image, files, db, callback) {
    if (image !== undefined && image.length === 0) {
      image = undefined;
    }
    sergeant ({
      membership : { table: db.membership, load: { userId: authUser.id, id: membershipId },
        beforeSave: sergeant.and(sergeant.stopIfNotFound, setPrepareMembership.bind(null, image, files)),
        save: true,
        finally: sergeant.json }},
      'membership',  callback);
  }

  function setPrepareMembership (imageData,files, data) {
    var membership = data.membership;
    membership.hasImage = (imageData !== undefined);
    return files.set(getImageFilename(membership.id),imageData);
  }

  function getImageFilename (membershipId) {
    return membershipId+'.png';
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function existsSync (files, membershipId) {
    return files.exists(getImageFilename(membershipId));
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};
  function setControllers (controllerMap) {
    controllers = controllerMap;
  }
  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.archive = archive;
  module.exports.existsSync = existsSync;
  module.exports.get = get;
  module.exports.list = list;
  module.exports.set = set;
  module.exports.getImageFilename = getImageFilename;

})();