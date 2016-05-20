;(function UserClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var modelUtils = require ( '../helpers/modelUtils.js' );

  var status = modelUtils.toEnum(['active', 'suspended', 'archived']);
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
        return modelUtils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: modelUtils.simplyReturn.bind({},editableFields)
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