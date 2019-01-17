import forEach from '../forEach.js';

class UserDB {
  constructor(db) {
    this.table = 'users'
    this.db = db;
    this.columns = {};
  }

  defineColumn(columnName, spec) {
    let extraSpec = {};
    try {
      extraSpec = JSON.parse((spec.column_comment || '{}').replace(/[“”]/g,'\"'));
    } catch(err) {
      //TODO: fix email pattern failing
      // console.log('>>', err, (spec.column_comment || '{}').replace(/[“”]/g,'\"'));
    }
    
    this.columns[columnName] = {
      type: spec.column_type,
      isNullable: spec.is_nullable,
      readOnly: extraSpec.readOnly,
      required: extraSpec.required
    };
  }

  query() {}

  get(criteria) {
    if (typeof criteria !== 'object') {
      criteria = { id: criteria };
    }
    const criteriaArray = [];
    
    //TODO: handle complex queries with OR
    forEach(criteria, (key, value) => {
      criteriaArray.push(`${key} = '${value}'`);
    });
    return this.db.query(`SELECT * FROM ${this.table} WHERE ${criteriaArray.join(' AND ')}`);
  }

  set(user) {
    if (user.id) {
      return this.db.update(this.table, user, this.columns);
    } else {
      return this.db.insert(this.table, user, this.columns);
    }
  }

  create(userData) {
    let now = new Date();

    return {
      email : userData.email,
      // status: status[userData.status] || status.active,
      // gender: gender[userData.gender] || gender.undefined,
      created: now,
      modified: now,
      lastLogin: now
    };
  }
}

export default UserDB;