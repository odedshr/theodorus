;(function UserClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );

  var status = { active: "active", suspended: "suspended", archived: "archived"};
  var editableFields = ['birthDate','isFemale'];
  
  module.exports = {
    name: 'user',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      lastLogin:  Date,
      email: String,
      birthDate: Date,
      isFemale: Boolean
    },
    relations: function (model, models) {
    },
    manualFields: ['birthDate','isFemale'],
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew ( user) {
      var now = new Date ();
      return {
        email : user.email,
        status: status[user.status] ? status[user.status] : status.active,
        created: now,
        modified: now,
        lastLogin: now
      };
    }
  };


  function toJSON (user) {
    return {
      id: user.id,
      status: user.status,
      created: user.created,
      modified: user.modified,
      lastLogin: user.lastLogin,
      email: user.email,
      birthDate: user.birthDate,
      isFemale: user.isFemale
    };
  }

  function getEditables () {
    return editableFields;
  }
})();