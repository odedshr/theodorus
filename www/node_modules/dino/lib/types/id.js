var uuid = require('node-uuid'),
    _ = require('underscore');

module.exports = exports = _.extend({}, require('./string'), {
    
    defaultValue: function () {
        return uuid.v4().replace(/\-/g, '');
    }
    
});