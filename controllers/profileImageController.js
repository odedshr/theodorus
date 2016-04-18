(function profileImageControllerClosure() {
  'use strict';

  var chain = require('../helpers/chain.js');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, membershipId, files, db, callback) {
    chain ([{name:'membership', table:db.membership, parameters: {userId: authUser.id, id: membershipId }, continueIf: chain.onlyIfExists }],
      deleteProfileImageFile.bind(null, membershipId,image, files, callback), callback);
  }

  function deleteProfileImageFile (membershipId, files, callback) {
    files.set(membershipId+'.png', undefined, callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function getAllProfileImages (authUser, files, db, callback) {
    chain ([{name:'memberships', table:db.membership, parameters: {userId: authUser.id }, multiple: {} }], getAllProfileImagesOnMembershipsLoaded.bind(null, files, callback));
  }

  function getAllProfileImagesOnMembershipsLoaded (files, callback, data) {
    var images = [];
    var memberships = data.memberships;
    var count = memberships.length;
    while(count--) {
      var membershipId = memberships[count].id;
      if (files.exists(membershipId+'.png')) {
        images[images.length] = membershipId;
      }
    }
    callback(images);
  }

  function getProfileImage (membershipId, files, callback) {
    files.get(membershipId+'.png', function (img) {
      //callback((img instanceof Error) ? { _redirect: '/1px_transparent.png'} : { _file: 'image/png', content: img });
      if (img instanceof Error) {
        callback( { _status: 404 });
      } else {
        callback({ _file: 'image/png', content: img });
      }
    });
  }

  function setProfileImage (authUser, membershipId, image, files, db, callback) {
    chain ([{name:'membership', table:db.membership, parameters: {userId: authUser.id, id: membershipId }, continueIf: chain.onlyIfExists }],
      saveProfileImageFile.bind(null, membershipId,image, files, callback), callback);
  }

  function saveProfileImageFile (membershipId,data,files, callback) {
    files.set(membershipId+'.png',data, callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function existsSync (files, membershipId) {
    return files.exists(membershipId+'.png');
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
  module.exports.get = getProfileImage;
  module.exports.list = getAllProfileImages;
  module.exports.set = setProfileImage;


  module.exports.saveProfileImageFile = saveProfileImageFile;
})();