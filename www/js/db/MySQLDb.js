/*
 *  MySQLDb
 *  1. This file should be generic, meaning it should not have any hints regarding the schema its working with
 * */
(function MySQLDbClosure (){
    var mysql      = require('mysql'),
        pool = null,
        schema     ="",
        prefix     = "",
        vars        = function(){ return false;},
        log        = console.log,
        _          = require('underscore');

    exports.init = function (varsGetter,consoleLog) {
        if (varsGetter) { vars = varsGetter; }
        if (consoleLog) {
            log = consoleLog;
        }
        var appName = vars("application_name", true);
        pool  = mysql.createPool({
            host     : vars(appName+"_MYSQL_HOST", true),
            port     : vars(appName+"_MYSQL_PORT", true),
            user     : vars(appName+"_MYSQL_USER", true),
            password : vars(appName+"_MYSQL_PASSWORD", true)
        });
        schema = vars(appName+"_MYSQL_SCHEMA", true);
        prefix = schema +"."+vars("table_prefix", true);
    };


    exports.getSchema = function () { return schema; }
    exports.getPrefix = function () { return prefix; }

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
        if (parameters.length==0) {
            insert (connection, item, callback);
        } else {
            var query = "UPDATE "+prefix+item.collection+" SET "+parameters.join(", ") + " WHERE ("+filters.join(" AND ") +");";
            connection.query(query, function(err, result) {
                if (err) {
                    console.error("UPDATE failed: \n"+query+"\n"+err);
                    throw err;
                } else if (result.affectedRows==0 && !item.autoId) {
                    insert (connection, item, callback);
                } else {
                    callback(item);
                }
            });
        }
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
            } else if (item.autoId) {
                item.set(item.key,result.insertId);
            }
            callback(item);
        });
    }

    exports.save = function (item, callback) {
        var query = null;
        try {
            pool.getConnection(function(error, connection) {
                if (error) {
                    console.error("save/getConnection error:" + error);
                    callback (false, error);
                } else {
                        if (!item.key || (typeof item.get(item.key) !== "undefined")) {
                            update(connection,item,callback);
                        } else {
                            insert (connection, item, callback);
                        }
                        connection.release();
                }
            });
        } catch (error) {
            console.error("save error:" + error +"\n"+query);
            callback (false, error);
        }
    };

    function sanitizeJSONObject (item) {
        var json = item.toJSON();
        for (var key in json) {
            var value = json[key]; //TODO: convert ' and " => something else
            json[key] = (typeof value === "object" ? JSON.stringify(value) : value);
        }
        return json;
    }

    function parseJSONbyKey (value, key) {
        switch (key) {
            case "array":
            case "object":
                return JSON.parse(value);
            default:
                return value;
        }
    }

    function parseJSON (JSONData, schema) {
        var newData = {};
        for (var key in schema) {
            if (JSONData[key]) {
                try {
                    newData[key] = parseJSONbyKey(JSONData[key],schema[key]);
                } catch (error) {
                    newData[key] = (JSONData[key]); //TODO: convert back' and ";
                }
            }
        }
        return newData;
    }

    exports.getItem = function (model,key,callback) {
        var where = "WHERE "+((typeof key == "object") ? (_.keys(key)[0] +" = '"+_.values(key)[0]+"'") : model.key +" = '"+key+"'"),
            query = "SELECT * FROM "+prefix+model.collection + " "+where+" LIMIT 1";
        try {
            exports.query (query, function(rows) {
                callback((rows.length>0) ? new model(rows[0], model.schema) : false);
            });
        } catch (error) {
            console.error("getItem ("+query+") : " + error);
            callback(false);
        }
    };

    exports.getItems = function (model,parameters,callback) {
        var pageSize = (parameters.pageSize) ? parameters.pageSize : 0,
            page =  (parameters.page) ? parameters.page : 1,
            limit = pageSize>0 ? ("LIMIT "+((page-1)*pageSize)+", "+pageSize ): "";

        if (!parameters.where) {
            parameters.where = [];
        }
        if (parameters.whitelist) {
            parameters.where.push ({"key":"t.topic_id","operator":"IN","value":parameters.whitelist});
        }
        parameters.where.push ({"key":"status","operator":"<>","value":"removed"});
        //TODO: parse queryOptions to get SORTBY and WHERE filters
        exports.query ("SELECT * "+
            "\n\t"+"FROM "+prefix+model.collection +
            renderWhereString(parameters.where)+
            "\n\t"+"GROUP BY topic_id"+
            "\n\t"+"ORDER BY score DESC, t.modified DESC" +
            "\n\t"+limit + ";", function(rows) {
            var schema =model.schema;
            if (rows) {
                rows.forEach(function(value,key,array) {
                    array[key] = new model(parseJSON(value, schema));
                });
            }
            callback(rows);
        });
    };

    exports.query = function (query,callback,logQuery) {
        if (logQuery) {
            log (query);
        }
        try {
            pool.getConnection(function(err, connection) {
                if (err) {
                    console.error("query/getConnection error:" + err);
                    callback (false);
                    throw err;
                } else {
                    connection.query(query , function(err, rows) {
                        if (err) {
                            switch (err.errno) {
                                case 1044 : log("Access denied error for query: "+query,"error"); break;
                                default:
                                    log ( "Query failed: "+query,"error");
                                    log (err, "error");
                            }
                            callback(err);
                        } else {
                            callback(rows);
                        }
                    });
                    connection.release();
                }
            });
        } catch (error) {
            console.error("error occurred for this query: "+ query);
            callback (false);
            throw error;
        }
    };

    exports.executeMultipleUpdates = function executeMultipleUpdates (queryArray, callback, logQuery) {
        var results = []
        var internal = function (queries) {
            exports.query (queries.pop(), function (result) {
                results.push(result);
                if (queries.length) {
                    internal( queries);
                } else {
                    callback(results);
                }
            }, logQuery);
        }
        internal(queryArray.reverse());
    }

    exports.nullifyField = function (sampleModel,key,field, callback) {
        var where = "WHERE "+((typeof key == "object") ? _.keys(key)[0] +" = '"+_.values(key)[0]+"'" : sampleModel.key +" = '"+key+"'");
        exports.query ("UPDATE "+prefix+sampleModel.collection + " SET "+field+" = NULL "+where, function(rows) {
            callback({});
        });
    };


    exports.renderWhereString = function renderWhereString (filters) {
        if (filters) {
            var where = [];
            filters.forEach(function(value) {
                if (value.operator=="IN") {
                    where.push(value.key + " IN ('"+value.value.join("','")+"')");
                } else {
                    where.push(value.key + " "+ value.operator + " " + (isNaN(value.value) ? "'"+value.value+"'" : value.value));
                }
            });
            return "\n\t"+ "WHERE " + where.join(" AND ");
        }
        return "";
    }
})();