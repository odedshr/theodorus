/*
 *  MySQLDb
 *  1. This file should be generic, meaning it should not have any hints regarding the schema its working with
 * */
var mysql      = require('mysql'),
    pool = null,
    prefix     = "",
    _          = require('underscore');

exports.init = function (config) {
    pool  = mysql.createPool({
        host     : process.env.THEODORUS_MYSQL_HOST,
        port     : process.env.THEODORUS_MYSQL_PORT,
        user     : process.env.THEODORUS_MYSQL_USER,
        password : process.env.THEODORUS_MYSQL_PASSWORD
    });
    prefix = process.env.THEODORUS_MYSQL_SCHEMA+"."+config.table_prefix;
};

function update (connection, item, callback) {
    var parameters = [],
        filters = [],
        key = null;
    if (item.key) {
        var jsonized = sanitizeJSONObject(item),
            itemKey = item.get(item.key);
            delete jsonized[item.key];
        for (key in jsonized) {
            parameters.push(key + " = '"+jsonized[key]+"'");
        }
        filters.push (item.key+" = '"+itemKey+"'");
    } else {
        var dataSet = item.set,
            whereSet = item.where;
        for (key in dataSet) {
            parameters.push(key + " = '"+dataSet[key]+"'");
        }
        for (key in whereSet) {
            filters.push("("+key + " = '"+whereSet[key]+"')");
        }
    }
    var query = "UPDATE "+prefix+item.collection+" SET "+parameters.join(", ") + " WHERE ("+filters.join(" AND ") +");";
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
    var keys = [], values = [], dataSet = null;
    if (item.key) {
        dataSet = sanitizeJSONObject(item);
        keys = _.keys(dataSet);
        values = _.values(dataSet);
    } else {
        keys = _.keys(item.set);
        keys = keys.concat(_.keys(item.where));
        values = _.values(item.set);
        values = values.concat(_.values(item.where));
    }
    var query = "INSERT INTO "+prefix+item.collection + " ("+keys.join(",")+") VALUES ('"+values.join("','")+"');";
    connection.query(query , function(err, result) {
        if (err) {
            console.error("INSERT failed: \n"+query+"\n"+err);
            throw err;
        }
        if (item.autoId) {
            item.set(item.key,result.insertId);
        }
        callback(item);
    });
}

exports.save = function (item, callback) {
    var query = null;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error("save/getConnection error:" + error +"\n"+query);
            callback (false);
        } else {
            try {
                if (!item.key || (typeof item.get(item.key) !== "undefined")) {
                    update(connection,item,callback);
                } else {
                    insert (connection, item, callback);
                }
                connection.end();
            } catch (error) {
                console.error("save error:" + error +"\n"+query);
                callback (false);
            }
        }
    });
};

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
            var newValue = (JSONData[key]); //TODO: convert back' and "
            switch (schema[key]) {
                case "array":
                case "object":
                    try {
                        newData[key] = JSON.parse(newValue);
                    } catch (error) {
                        console.error("error parsing "+key+" = " + newValue + "("+error+")");
                        newData[key] = newValue;
                    }
                    break;
                default:
                    newData[key] = newValue;
            }
        }
    }
    return newData;
}

exports.getItem = function (sampleModel,key,callback) {
    var where = "WHERE "+((typeof key == "object") ? _.keys(key)[0] +" = '"+_.values(key)[0]+"'" : sampleModel.key +" = '"+key+"'");
    exports.query ("SELECT * FROM "+prefix+sampleModel.collection + " "+where+" LIMIT 1", function(rows) {
        callback((rows.length>0) ? parseJSON(rows[0], sampleModel.schema) : false);
    });
};

exports.getItems = function (sampleModel,queryOptions,callback) {
    //TODO: parse queryOptions to get SORTBY and WHERE filters
    exports.query ("SELECT * FROM "+prefix+sampleModel.collection, function(rows) {
        var schema =sampleModel.schema;
        if (rows) {
            rows.forEach(function(value,key,array) {
                array[key] = parseJSON(value, schema);
            });
        }
        callback(rows);
    });
};

exports.query = function (query,callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error("query/getConnection error:" + err);
            callback (false);
        } else {
            try {
                connection.query(query , function(err, rows) {
                    if (err) {
                        throw err;
                    }
                    try {
                        callback(rows);
                    } catch (error) {
                        console.error("query callback error:" + error);
                        throw error;
                    }
                });
                connection.end();
            } catch (error) {
                dumpError(error);
                callback (false);
            }
        }
    });
};

function dumpError(err) {
    if (typeof err === 'object') {
        if (err.message) {
            console.error('\nMessage: ' + err.message)
        }
        if (err.stack) {
            console.error('\nStacktrace:')
            console.error('====================')
            console.error(err.stack);
        }
    } else {
        console.error('dumpError :: argument is not an object');
    }
}