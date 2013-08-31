var _ = require('underscore'),
    helper = require('./helper');

var collection = {
    
    toJSON: function () {
        return _.map(this.models, function(m){ return m.toJSON(); });
    }
    
};

module.exports = exports = function (arr) {
    return Object.create(collection, helper.ownProperties({
        models: arr || []
    }));
};