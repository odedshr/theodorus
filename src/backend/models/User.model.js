import modelUtils from '../helpers/modelUtils.js';
import Sequelize from 'sequelize';

class User {
  constructor(userData) {
    let now = new Date ();

    return {
      email : userData.email,
      status: status[userData.status] || status.active,
      gender: gender[userData.gender] || gender.undefined,
      created: now,
      modified: now,
      lastLogin: now
    };
  }
}

const name = "user",
  status = modelUtils.toEnum(['active', 'suspended', 'archived']),
  gender = modelUtils.toEnum(['undefined', 'female', 'male']),
  schema = {
    id: {
      db: { type: Sequelize.STRING, primaryKey: true },
      editable: false,
      required: true
    },
    status: {
      db: Sequelize.ENUM(...Object.keys(status)),
      editable: false,
      required: true,
    },
    created: {
      db: Sequelize.DATE,
      editable: false,
      required: true,
    },
    modified: {
      db: Sequelize.DATE,
      editable: false,
      required: true,
    },
    lastLogin: {
      db: Sequelize.DATE,
      editable: false,
      required: true,
    },
    email: String,
    birthDate: {
      db: Sequelize.DATE,
      editable: false,
      required: true,
    },
    email: {
      db: Sequelize.STRING,
      editable: true,
      required: true,
    },
    status: {
      db: Sequelize.ENUM(...Object.keys(gender)),
      editable: true,
      required: true,
    }
  },
  allFields = Object.keys(schema).map(key => schema[key]),
  onlyRequired = modelUtils.filterFieldsBy(schema, field => field.editable),
  editableFields = modelUtils.filterFieldsBy(schema, field => field.editable),
  
  methods = {
    toJSON(isMinimal) { return modelUtils.toJSON(this, isMinimal ? onlyRequired : allFields) },
    getEditables() { return editableFields; }
  };

function getNew(userData) {
  return new User(userData);
}

export default{
  User,
  name,
  status,
  gender,
  schema,
  getNew,
  editableFields,
  methods,

  relations() {},
  validations: {},
};
