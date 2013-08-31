var moment = require('moment');

module.exports = exports = {
    
    defaultValue: function () {
        return moment.utc();
    },
    
    deserialize: function (val) {
        return moment.utc(val);
    },
    
    serialize: function (val) {
        return val.format();
    },
    
    toJSON: function (val) {
        return val.format();
    }
    
};