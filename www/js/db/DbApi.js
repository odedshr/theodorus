(function DbApi() {
    var initDb = function initDb (config) {
        if (typeof config.db_type == "undefined") {
            throw "DbApi:config.db_type-undefined";
        }
        var db = null;
        switch (config.db_type) {
            case "dynamo": db = require("./DynamoDbApi"); break;
            case "mongo": db = require("./MongoDbApi"); break;
            case "mysql": db = require("./MySQLDbApi"); break;
            case "mock": db = require("./MockDbApi"); break;
        }
        db.init(config);
        return db;
    };

    if (typeof exports !== "undefined") {
        exports.get = initDb;
    }
})();
