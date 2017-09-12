;(function UserClosure() {
  'use strict';

  var modelUtils = require ( '../helpers/modelUtils.js' );

  var status = modelUtils.toEnum(['active', 'suspended', 'archived']);
  var gender = modelUtils.toEnum(['undefined', 'female', 'male']);
  var editableFields = ['birthDate','gender'];
  var jsonMinimalFields = ['id','status','created','modified','lastLogin','email','birthDate','gender'];
  var jsonFields = jsonMinimalFields;

  module.exports = {
    name: 'user',
    status: status,
    gender: gender,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      lastLogin:  Date,
      email: String,
      birthDate: Date,
      gender: Object.keys(gender)
    },
    relations: function () {
    },
    manualFields: ['birthDate','gender'],
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
        gender: gender[user.gender] ? gender[user.gender] : status.undefined,
        created: now,
        modified: now,
        lastLogin: now
      };
    }
  };

})();
