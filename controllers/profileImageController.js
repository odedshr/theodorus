(function profileImageControllerClosure() {
  'use strict';

  var chain = require('../helpers/chain.js');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');


  function getAllProfileImages (authUser, files, db, callback) {
    chain ([{name:'memberships', table:db.membership, parameters: {userId: authUser.id }, multiple: {} }], getAllProfileImagesOnMembershipsLoaded.bind(null, files, callback));
  }

  function getAllProfileImagesOnMembershipsLoaded (files, callback, data) {
    var images = [];
    var memberships = data.meberships;
    var count = memberships.length;
    while(count--) {
      var membershipId = Encryption.unmask(memberships[count].id);
      if (files.exists(membershipId+'.png')) {
        images[images.length] = Encryption.unmask(membershipId);
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
    var membershipUnmaskedId = Encryption.unmask(membershipId);
    chain ([{name:'membership', table:db.membership, parameters: {userId: authUser.id, id: membershipUnmaskedId }, continueIf: chain.onlyIfExists }],
      setProfileImageOnMembershipLoaded.bind(null, membershipId+'.png',image, files, callback), callback);
  }

  function setProfileImageOnMembershipLoaded (fileName,data,files, callback) {
    files.set(fileName,data, callback);
  }

  module.exports.getAllProfileImages = getAllProfileImages;
  module.exports.getProfileImage = getProfileImage;
  module.exports.setProfileImage = setProfileImage;

})();