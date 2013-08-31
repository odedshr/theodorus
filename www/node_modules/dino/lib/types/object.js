module.exports = exports = {
    
    deserialize: function (val) {
        
        var parsed = null;
        
        try
        {
            parsed = JSON.parse(val);
        }
        catch (ex)
        {
            return null;
        }
        
        return parsed;
    },
    
    serialize: function (val) {
        if (!val) return null;
        return JSON.stringify(val);
    }
    
};