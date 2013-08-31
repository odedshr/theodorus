var mysql      = require('mysql'),
    pool = null,
    prefix     = "",
    _          = require('underscore');


exports.init = function (config) {
    pool  = mysql.createPool({
        host     : config.mysql_host,
        port     : config.mysql_port,
        user     : config.mysql_user,
        password : config.mysql_password,
    });
    prefix = config.mysql_schema+"."+config.table_prefix;
}

function createDb (connection, callback) {
    exports.query
}
function update (connection, item, callback) {
    var jsonized = sanitizeJSONObject(item);
    var itemKey = item.get(item.key)
    delete jsonized[item.key];
    var parameters = [];
    for (var key in jsonized) {
        parameters.push(key + " = '"+jsonized[key]+"'");
    }
    var query = "UPDATE "+prefix+item.collection+" SET "+parameters.join(", ") + " WHERE "+item.key+" = '"+itemKey+"';";
    connection.query(query, function(err, result) {
        if (err) {
            throw err;
        } else if (result.affectedRows==0 && !item.autoId) {
            insert (connection, item, callback);
        } else {
            callback(item);
        }
    });
}

function insert (connection, item, callback) {
    var jsonized = sanitizeJSONObject(item);
    var query = "INSERT INTO "+prefix+item.collection + " ("+_.keys(jsonized).join(",")+") VALUES ('"+_.values(jsonized).join("','")+"');"
    connection.query(query , function(err, result) {
        if (err) {
            throw err;
        }
        if (item.autoId) {
            item.set(item.key,result.insertId);
        }
        callback(item);
    });
}

exports.save = function (item, callback) {
    var query = null
    pool.getConnection(function(err, connection) {
        try {
            if (err) {
                throw err;
            } else {
                if (typeof item.get(item.key) !== "undefined") {
                    update(connection,item,callback);
                } else {
                    insert (connection, item, callback);
                }
            }
            connection.end();
        } catch (error) {
            console.error("save error:" + error +"\n"+query);
            callback (false);
        }
    });
}

function sanitizeJSONObject (item) {
    var json = item.toJSON();
    for (var key in json) {
        var value = json[key]; //TODO: convert ' and " => something else
        json[key] = (typeof value === "object" ? JSON.stringify(value) : value);
    }
    return json;
}

function parseJSON (JSONData, schema) {
    var newData = {};
    for (var key in schema) {
        if (JSONData[key]) {
            var newValue = (JSONData[key]) //TODO: convert back' and "
            newData[key] = schema[key]!="array" ? newValue : JSON.parse(newValue);
        }
    }
    return newData;
}

exports.getItem = function (sampleModel,key,callback) {
    var where = "WHERE "+((typeof key == "object") ? _.keys(key)[0] +" = '"+_.values(key)[0]+"'" : sampleModel.key +" = '"+key+"'");
    exports.query ("SELECT * FROM "+prefix+sampleModel.collection + " "+where+" LIMIT 1", function(rows) {
        callback((rows.length>0) ? parseJSON(rows[0], sampleModel.schema) : false);
    });
}

exports.getItems = function (sampleModel,queryOptions,callback) {
    //TODO: parse queryOptions to get SORTBY and WHERE filters
    exports.query ("SELECT * FROM "+prefix+sampleModel.collection, function(rows) {
        var schema =sampleModel.schema
        rows.forEach(function(value,key,array) {
            array[key] = parseJSON(value, schema);
        });
        callback(rows);
    });
}

exports.query = function (query,callback) {
    pool.getConnection(function(err, connection) {
        try {
            if (err) {
                throw err;
            } else {
                connection.query(query , function(err, rows) {
                    if (err) {
                        throw err;
                    }
                    try {
                        callback(rows);
                    } catch (error) {
                        console.error("query callback error:" + error);
                        callback (false);
                    }
                });
            }
            connection.end();
        } catch (error) {
            console.log("query error:" + error);
            callback (false);
        }
    });
}