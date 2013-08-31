module.exports = exports = {
    
    key: 'N',
    
    deserialize: function (val) {
        return val === '1';
    },
    
    serialize: function (val) {
        return (val === true) ? '1' : '0';
    }
    
};