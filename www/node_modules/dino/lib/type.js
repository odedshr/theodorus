var _ = require('underscore');

var type = {
    
    key: 'S',
    
    defaultValue: null,
    
    getDefaultValue: function () {
        return _.isFunction(this.defaultValue) ? this.defaultValue() : this.defaultValue;
    },
    
    deserializeObject: function (obj) {
        
        if (obj.hasOwnProperty(this.key))
        {
            return this.deserialize(obj[this.key]);
        }
        
        if (obj.hasOwnProperty(this.key + this.key))
        {
            return _.map(obj[this.key + this.key], this.deserialize);
        };
    },
    
    deserialize: function (val) {
        return val;
    },
    
    serializeObject: function (val) {
        
        var obj = {},
            isArray = _.isArray(val),
            key = this.key,
            transformed = isArray ? _.map(val, this.serialize) : this.serialize(val);
        
        if (transformed === null
            || transformed === ''
            || (_.isArray(transformed) && transformed.length === 0))
        {
            return null;
        }
        
        if (isArray)
        {
            key += this.key;
        }
        
        obj[key] = transformed;
        
        return obj;
    },
    
    serialize: function (val) {
        return val;
    },
    
    toJSON: function (val) {
        return val;
    }
    
};

module.exports = exports = function (options) {
    return Object.create(_.extend({}, type, options));
};