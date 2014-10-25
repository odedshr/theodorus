(function MySQLDbAdminClosure (){
    var ModelUpdate = require("../models/ModelUpdate").model(),

        MySQLDbAdmin = (function (){
        return {
            db : false,
            vars : function () { return false; },
            log : console.log,
            schema: "",
            prefix: "",
            modelUpdateTableFullName: "",

            init: function init (db,vars, log) {
                this.db = db;
                this.vars = vars;
                this.log = log;
                this.schema = db.getSchema();
                this.prefix = vars("table_prefix", true);
                this.modelUpdateTableFullName = this.schema+"."+this.prefix+(new ModelUpdate()).collection;
            },

            verifyDBIntegrity : function verifyDBIntegrity (models,callback) {
                var self = this,
                    outputs = {};

                self.checkDB( function schemaExists () {
                    self.db.query ( "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY"+
                            "\n\t"+"FROM information_schema.columns WHERE table_schema='"+self.schema+"'",
                        function (results) {
                            var collections = {};
                            results.forEach(function perRecord (record) {
                                var tableName = record.TABLE_NAME;
                                if (!collections[tableName]) {
                                    collections[tableName] = {};
                                }
                                collections[tableName][record.COLUMN_NAME] = record;
                            });

                            models.forEach(function perModel (model){
                                var tableName = model.collection,
                                    table = collections[tableName];
                                if (!table) {
                                    self.createTable(model, function () {});
                                    outputs[tableName] = "created";
                                } else {
                                    var schema = model.schema,
                                        columnResults = [];

                                    _.keys(schema).forEach(function perField(key) {
                                        var column = table[key];
                                        if (!column) {
                                            self.db.query ("ALTER TABLE `"+self.schema+"`.`"+model.collection+"` "+
                                                    "\n\t"+"ADD COLUMN " + self.getColumnString (key, schema[key], model.autoId),
                                                function () {});
                                            columnResults.push ("column added:"+ key);
                                        } else {
                                            //TODO: verify column details
                                            //ALTER TABLE `theo`.`user_topic` CHANGE COLUMN `topic_id` `topic_id` VARCHAR(11) NULL  ;
                                        }
                                    });
                                    outputs[tableName] = columnResults.length ? columnResults : "ok";
                                }
                            });

                            callback (outputs);
                        });
                });
            },

            checkDB : function checkDB (callback) {
                var self = this;
                callback = callback || function(){};

                self.isDbExists(function (output) {
                   if (output.result === false) {
                       self.log("Creating Database ...");
                       self.createDb(callback);
                   } else {
                       callback({"result":true});
                   }
                });
            },

            isDbExists : function isDbExists (callback) {
                this.db.query ( "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '"+this.schema+"'" , function (rows) {
                    callback({"result":(rows.length>0)});
                });
            },

            createDb : function createDb (callback) {
                this.db.query ( "CREATE SCHEMA IF NOT EXISTS `"+this.schema+"` DEFAULT CHARACTER SET utf8" , function (rows) {
                    if (rows.errno) {
                        switch (rows.errno) {
                            case 1044 : log("NO PERMISSIONS TO CREATE SCHEMA. PLEASE CREATE '`"+this.schema+"`' MANUALLY AND TRY RESTART "+vars("application_name"),"error"); break;
                            default: log("UNKNOWN ERROR OCCURRED ("+rows.errno+":"+rows.code+"). PLEASE CREATE '`"+this.schema+"`' MANUALLY AND TRY RESTART "+vars("application_name"),"error");
                        }
                        callback (rows);
                    } else {
                        callback({"result":(rows.affectedRows>0), complete:rows});
                    }
                });
            },

            isTableExists : function isTableExists (tableName, callback) {
                this.db.query ( "SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = '"+this.schema+"' AND TABLE_NAME = '"+this.prefix+tableName+"'" , function (rows) {
                    callback({"result":(rows.length>0)});
                });
            },

            executeCreateTableQuery : function executeCreateTableQuery (queryString, callback) {
                var self = this;
                callback = callback || function (){};

                self.db.query ( queryString , function (output) {
                    if (output.errno) {
                        throw new Error ("FAILED TO CREATE "+ self.prefix+model.collection+":" + JSON.stringify(output));
                    }
                    callback(output);
                });
            },

            getDataType : function getDataType (columnData, isAutoId) {
                switch (columnData.type) {
                    case "text":
                        return columnData.size ? ("VARCHAR("+columnData.size+")") : "TEXT";
                    case "number":
                        switch (columnData.size) {
                            case 2: return "DECIMAL";
                            case 4: return "FLOAT";
                            case 8: return "DOUBLE";
                            default: return "FLOAT";
                        }
                        return "FLOAT";
                    case "integer":
                        switch (columnData.size) {
                            case 2: return "TINYINT";
                            case 4: return "SMALLINT";
                            case 8: return "BIGINT";
                            default: return "INT";
                        }
                        return "INT";
                    case "boolean": return "BOOL";
                    case "date": return columnData.time ? "DATE" : "DATETIME";
                    case "enum": return "ENUM('"+columnData.values.join("','")+"')";
                    case "object": return "TEXT"; //json
                    case "point": return "POINT";
                    case "binary": return "BINARY";
                    case "serial": return "INT" + (isAutoId ? " AUTO_INCREMENT" : "");
                    default:
                        this.log("column with no type?! "+ JSON.stringify(columnData) );
                        return "TEXT"; //how did you get here?!
                }
            },

            getColumnString : function getColumnString (columnName, columnData, isAutoId) {
                var columnString = "`"+columnName+"` ";
                columnString += this.getDataType (columnData, isAutoId);
                if (columnData.defaultValue) {
                    columnString += " DEFAULT '"+columnData.defaultValue+"'";
                }
                columnString += (columnData.isNull?"":" NOT") + " NULL";
                return columnString;
            },
            createTable : function createTable (modelClass, callback) {
                var self = this,
                    model = new modelClass(),
                    modelSchema = model.schema,
                    queryString = "",
                    keys = [];

                if (!Array.isArray(model.key)) {
                    keys.push("PRIMARY KEY (`"+model.key+"`)");
                }

                for (var columnName in modelSchema) {
                    var columnData = modelSchema[columnName];
                    queryString += (queryString.length?", ":"") + self.getColumnString (columnName, columnData, modelClass.autoId);

                    if (columnData.isSecondaryKey) {
                        keys.push("KEY `idx_"+model.collection+"_"+columnName+"` (`"+columnName+"`)");
                    } else if (columnData.isUnique) {
                        keys.push("UNIQUE KEY `idx_"+model.collection+"_"+columnName+"` (`"+columnName+"`)");
                    }
                }
                this.executeCreateTableQuery("CREATE TABLE "+self.schema+"."+self.prefix +model.collection+" (" + queryString+", "+ keys.join (",") +") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback);
            },

            getInsertIntoModelUpdateTableQuery : function getInsertIntoModelUpdateTableQuery (tableName) {
                return "INSERT INTO "+this.modelUpdateTableFullName+ " (model,modified) VALUES ('"+tableName+"','"+(new Date()).toISOString()+"')";
            },

            getUpdateIntoModelUpdateTableQuery : function getUpdateIntoModelUpdateTableQuery (tableName) {
                return "UPDATE "+this.modelUpdateTableFullName+ " SET modified = '"+(new Date()).toISOString()+"' WHERE model='"+tableName+"'";
            }

    };
    })();

    exports.init = MySQLDbAdmin.init.bind(MySQLDbAdmin);
    exports.checkDB = MySQLDbAdmin.checkDB.bind(MySQLDbAdmin);
    exports.verifyDBIntegrity = MySQLDbAdmin.verifyDBIntegrity.bind(MySQLDbAdmin);


    exports.isTableExists = MySQLDbAdmin.isTableExists.bind(MySQLDbAdmin);
    exports.createTable = MySQLDbAdmin.createTable.bind(MySQLDbAdmin);
})();