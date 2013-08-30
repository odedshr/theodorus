var _ = require('underscore');

exports.ownProperties = function (options) {
    
    if (!options)
    {
        return;
    }
    
    var ownProperties = {},
        key;
    
    for (key in options)
    {
        if (options.hasOwnProperty(key))
        {
            ownProperties[key] = { value: options[key], enumerable: true };
        }
    }
    
    return ownProperties;
};

exports.normalizeKey = function (keys) {
    if (_.isString(keys)) return [keys];
    if (_.isArray(keys)) return keys;
    return null;
};