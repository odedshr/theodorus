// Load the necessary servers.
//var AWS = require('aws-sdk');
//AWS.config.access
//var db = null;

var db = require('dino');
var prefix = "";
var _ = require('underscore');

exports.init = function (config) {
    //db = new AWS.DynamoDB({"accessKeyId":config.aws_accessKeyId,"secretAccessKey":config.aws_secretAccessKey, "region":config.aws_region});
    db.connect({
        accessKeyId: config.aws_accessKeyId,
        secretAccessKey: config.aws_secretAccessKey,
        region: config.aws_region
    });
    prefix = config.table_prefix;

    /*db.model({
         schema: db.schema({
             table: 'thedorous_user_user',
             attributes: {
                 "user_id": db.types.number,
                 "other_user_id": db.types.number
             },
            key: { "hash": 'user_id', "range": 'other_user_id' }
         })
     }).find ({"match":{"user_id": 1, "other_user_id":1}}, function(err, item, units){
     try {
         console.log("err:"+ ((err)?JSON.stringify(err):"no-error"));
         console.log ("item:"+(item)?JSON.stringify(item):"no-item");
         } catch (err) {
            console.error(err);
         }
     });
*//*
    console.log("looking for uniqueId");
    db.model({
        schema: db.schema({
            table: 'theodorus_uniqueIds',
            attributes: {
                "table_name": db.types.string,
                "last_id": db.types.number
            },
            key: { "hash": 'table_name' }
        })
    }).findOne({"table_name": 'users'}, function(err, item, units){
            try {
                console.log("err:"+ ((err)?JSON.stringify(err):"no-error"));
                console.log ("item:"+(item)?JSON.stringify(item):"no-item");
            } catch (err) {
                console.error(err);
            }
        });*/
    //{"auth_key":"odedshr@gmail.com","password":"c62d929e7b7e7b6165923a5dfc60cb56","user_id":7}
    //{"user_id":7,"sn":0,"display_name":"Oded Sharon","uri":null,"picture":null,"email":"odedshr@gmail.com","birthday":null,"language":"he","status":"resident","isVerified":false,"isDelegate":false,"isModerator":false,"score":0,"badges":[],"penalties":[]}

    /*console.log("saving");
    db.model({
        schema: db.schema({
            table: 'theodorus_credentials',
            attributes: {
                "auth_key": db.types.string,
                "password": db.types.string,
                "user_id": db.types.number
            },
            key: { "hash": 'auth_key' }
        })
    }).create({"auth_key":"odedshr@gmail.com","password":"c62d929e7b7e7b6165923a5dfc60cb56","user_id":6}).save(function (err) {
            console.log ("save callback "+ err);
        });*/
    // ,,"badges":[],"penalties":[]
    /*db.model({
        schema: db.schema({
            table: 'theodorus_users',
            attributes: {
                "user_id": db.types.number,
                "sn": db.types.number,
                "display_name": db.types.string,
                "uri": db.types.string,
                "picture": db.types.string,
                "email": db.types.string,
                "language": db.types.string,
                "birthday": db.types.string,
                "status": db.types.string,
                "isVerified": db.types.boolean,
                "isDelegate": db.types.boolean,
                "isModerator": db.types.boolean,
                "score": db.types.number,
                "badges": db.types.object,
                "penalties": db.types.object
            },
            key: { "hash": 'user_id' }
        })
    }).findOne({"user_id": 1}, function(err, item, units){
            try {
                console.log("err:"+ ((err)?JSON.stringify(err):"no-error"));
                console.log ("item:"+(item)?JSON.stringify(item):"no-item");
            } catch (err) {
                console.error(err);
            }
        });


        /*create({"user_id":9,"display_name":"עודד שרון","email":"odedshr@gmail.com","language":"he","status":"resident"}).save(function (err) {
            console.log ("save callback "+ err);
        });
    console.log("saved");*/
}

var UniqueIds = {
    collection: "uniqueIds",
    key: "table_name",
    schema: {
        "table_name": "string",
        "last_id": "number"
    }
}

generateId = function (tableName, callback) {
    var table = getModel(UniqueIds),
        key = {"table_name":tableName}
    table.findOne(key, function (err, existing) {
        try {
            if (existing) {
                key.last_id = existing.get("last_id")+1;
                existing.set("last_id",key.last_id);
            } else {
                key.last_id = 1;
                existing = table.create(key);
            }
            existing.save();
            callback(key.last_id);
        } catch (error) {
            console.error(JSON.stringify(error));
        }
    });
}

exports.save = function (item, callback) {
    var table = getModel(item);
    var jsonized = sanitizeJSONObject(item);

    var saveCallback = function (error) {
        if (error) {
            console.error("failed saving item " + JSON.stringify(jsonized) +"\n"+ error);
            callback(false);
        } else {
            callback(item);
        }
    };

    var saveItem = function (jsonized) {
        try {
            var newDBItem = table.create(jsonized);
            newDBItem.save(saveCallback);
        }
        catch (error) {
            console.error("Failed to save item: "+ error);
            callback(error);
        }
    }
    var createNewItem = function (jsonized) {
        try {
            // create new;
            generateId (item.collection, function (newId) {
                item.set(item.key,newId)
                jsonized[item.key] = newId;
                saveItem(jsonized);
            });
        }
        catch (error) {
            console.error("Failed to set new item: "+ error);
            callback(error);
        }
    }

    var itemId = jsonized[item.key];
    if (itemId) {
        // try to find existing item
        var query = {};
        query[item.key] = itemId;
        table.findOne(query, function (err, existing) {
            try {
                if (existing) {
                    for (var x in jsonized) {
                        existing.set(x,jsonized[x]);
                    }
                    existing.save(saveCallback);
                } else {
                    saveItem(jsonized);
                }
            }
            catch (error) {
                console.error("failed setting item "+JSON.stringify(jsonized)+": " + error);
            }
        });
    } else {
        console.log("creating new in "+ item.collection);
        createNewItem(jsonized);
    }
}

function sanitizeJSONObject (item) {
    return item.toJSON(); //_.compact();
}

exports.getItem = function (sampleModel,key,callback) {
    try {
        var query = {}
        query[sampleModel.key] = key;

        getModel(sampleModel).findOne(query, function (err,data) {
            try {
                if (err && err.statusCode && err.statusCode!=200) {
                    throw err;
                }
                callback(data? data.toJSON() : false); // && err.code=="ResourceNotFoundException"
            }
            catch (err) {
                console.error("getItem: " +err);
                callback (false);
            }
        });
    } catch (error) {
        console.error("getItem catching error before they reach dino: " + error);
    }

}

exports.getItems = function (sampleModel,queryOptions,callback) {
    try {
        getModel(sampleModel) .find(queryOptions, function (err,existing) {
            callback(existing ? existing.toJSON() : null);
        });
    } catch (error) {
        console.error("getItems catching error before they reach dino: " + error);
    }
}

//========================
function translateType (typeName) {
    switch (typeName) {
        case "number": return db.types.number;
        case "date": return db.types. date;
        case "boolean": return db.types.boolean;
        case "array": return db.types.object
        case "string":
        case "email":
        default: return db.types.string;
    }
}

function getModel (sampleModel) {
    var attributes = {};
    var schema = sampleModel.schema;
    for (var key in schema) {
        attributes[key] = translateType(schema[key]);
    }

    return db.model({
        "schema" : db.schema({
            "table": prefix+ sampleModel.collection,
            "attributes": attributes,
            "key": { "hash": sampleModel.key }
        })
    });
}
    /*switch (sampleModel.collection) {
        case 'uniqueIds':
            attributes = {
                "table_name": db.types.string,
                "last_id": db.types.number
            };
            key ={ "hash": 'table_name'};
            break;
        case 'credentials':
            attributes = {
                "auth_key": db.types.string,
                "password": db.types.string,
                "user_id": db.types.number
            };
            key ={ "hash": 'auth_key' };
            break;
        case 'users':
            attributes = {
                "user_id": db.types.number,
                "sn": db.types.number,
                "display_name": db.types.string,
                "uri": db.types.string,
                "picture": db.types.string,
                "email": db.types.string,
                "language": db.types.string,
                "birthday": db.types.string,
                "status": db.types.string,
                "isVerified": db.types.boolean,
                "isDelegate": db.types.boolean,
                "isModerator": db.types.boolean,
                "score": db.types.number,
                "badges": db.types.object,
                "penalties": db.types.object
            };
            key ={ "hash": 'user_id' };
            break;
        default:
            console.error("getTableAttributes: unknown table ("+tableName+")");
            return false;*/