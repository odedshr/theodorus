;(function UserClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  var status = { active: "active", suspended: "suspended", archived: "archived"};
  var editableFields = ['birthDate','isFemale'];
  var jsonMinimalFields = ['id','status','created','modified','lastLogin','email','birthDate','isFemale'];
  var jsonFields = jsonMinimalFields;

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
      toJSON: function (isMinimal) {
        return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: utils.simplyReturn.bind({},editableFields)
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

})();