(function DbApi() {
    var initDb = function initDb (vars,log) {
        var dbType = vars("db_type");
        if (typeof dbType == "undefined") {
            throw new Error("DbApi:config.db_type-undefined","DbApi.jps");
        }
        var db = null;
        switch (dbType) {
            case "dynamo": db = require("./DynamoDbApi"); break;
            case "mongo": db = require("./MongoDbApi"); break;
            case "mysql": db = require("./MySQLDbApi"); break;
            case "mock": db = require("./MockDbApi"); break;
        }
        db.init(vars,log);
        return db;
    };

    if (typeof exports !== "undefined") {
        exports.init = initDb;
    }
})();
