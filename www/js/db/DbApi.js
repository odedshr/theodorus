exports.get = function (config) {
    if (typeof config.db_type == "undefined") {
        config.db_type = "dynamo"; // default DB;
    }
    var db = null;
    switch (config.db_type) {
        case "dynamo": db = require("./DynamoDbApi"); break;
        case "mongo": db = require("./MongoDbApi"); break;
        case "mysql": db = require("./MySQLDbApi"); break;
    }
    db.init(config);
    return db;
};