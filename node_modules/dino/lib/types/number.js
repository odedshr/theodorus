var _ = require('underscore');

module.exports = exports = {
    
    key: 'N',
    
    deserialize: function (val) {
        if (!val) return null;
        if (val%1 === 0) return parseInt(val, 10);
        val = parseFloat(val);
        return (_.isNumber(val) && !_.isNaN(val)) ? val : this.getDefaultValue();
    },
    
    serialize: function (val) {
        if (!_.isNumber(val)) return null;
        return '' + val;
    }
    
};