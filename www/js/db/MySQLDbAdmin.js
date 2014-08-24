(function MySQLDbAdminClosure (){
    var ModelUpdate = require("../models/ModelUpdate").model(),

        MySQLDbAdmin = (function (){
        return {
            db : false,
            vars : function () { return false; },
            log : console.log,
            schema: "",
            modelUpdateTableFullName: "",
            sqlInstructions: {},

            checkDB : function checkDB (db,vars, log) {
                var self = this;
                self.db = db;
                self.vars = vars;
                self.log = log;
                this.schema = db.getSchema();
                this.modelUpdateTableFullName = this.db.getPrefix()+(new ModelUpdate()).collection;
                try {
                    self.sqlInstructions = require(vars("sql_instructions"));
                }
                catch (err) {
                    self.log("Failed to load SQL-instructions ("+err.message+")","error");
                }


                self.isDbExists(function (output) {
                   if (output.result == false) {
                       self.log("Creating Database ...")
                       self.createDb(self.createDbCallback.bind(self));
                   } else {
                       self.isTableExists((new ModelUpdate()).collection, function(output) {
                           var checkAllTablesExceptModelUpdateCallback = function checkAllTablesExceptModelUpdateCallback(output) {
                               self.log((output && output.updated) ? "Database had "+output.updated+" updates" : "Database is up to date");
                           }
                           if (output.result==false) {
                               self.createModelUpdateTable(function () {
                                   self.checkAllTablesExceptModelUpdate(checkAllTablesExceptModelUpdateCallback);
                               });
                           } else {
                               self.checkAllTablesExceptModelUpdate(checkAllTablesExceptModelUpdateCallback);
                           }

                       });
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

            createDbCallback : function createDbCallback (output) {
                var self = this;
                if (output.result == true) {
                    self.createModelUpdateTable(function () {
                        self.createAllTablesExceptModelUpdate(function (output) {
                            self.log("created " + (output.created+1) + "tables in the database");
                        });
                    })
                } else {
                    throw new Error ("FAILED TO CREATE DB: "+ JSON.stringify(output))
                }
            },

            isTableExists : function isTableExists (tableName, callback) {
                this.db.query ( "SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = '"+this.schema+"' AND TABLE_NAME = '"+tableName+"'" , function (rows) {
                    callback({"result":(rows.length>0)});
                });
            },

            createTable : function createTable (tableName, callback) {
                this.db.query(this.sqlInstructions[tableName]["create-sql"].replace(/#PREFIX\./g,this.db.getPrefix()),function (output) {
                    if (output.errno) {
                        throw new Error ("FAILED TO CREATE "+tableName+":" + JSON.stringify(output));
                    }
                    callback(output);
                });
            },

            /* isTableContainsAllColumns
            * not is use
            * */
            isTableContainsAllColumns : function isTableContainsAllColumns (model, callback) {
                this.db.query ( "SELECT COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = '"+this.schema+"' AND TABLE_NAME = '"+model.collection+"'" , function (rows) {
                    var count = 0,
                        schema = model.schema;
                    rows.forEach(function(row) {
                        count += (schema[row.column_name]) ? 1 : 0 ;
                    });
                    callback({"result": count== Object.keys(model.schema).length });
                });
            },

            getInsertIntoModelUpdateTableQuery : function getInsertIntoModelUpdateTableQuery (tableName) {
                return "INSERT INTO "+this.modelUpdateTableFullName+ " (model,modified) VALUES ('"+tableName+"','"+(new Date()).toISOString()+"')";
            },

            getUpdateIntoModelUpdateTableQuery : function getUpdateIntoModelUpdateTableQuery (tableName) {
                return "UPDATE "+this.modelUpdateTableFullName+ " SET modified = '"+(new Date()).toISOString()+"' WHERE model='"+tableName+"'";
            },

            /*
             createModelUpdateTable
             ModelUpdate is created seperately because it's the only table that has content by default
            * */
            createModelUpdateTable : function createModelUpdateTable (callback) {
                var self=this,
                    queries = [],
                    instructions = self.sqlInstructions,
                    prefix =self.db.getPrefix(),
                    modelUpdatesTable = (new ModelUpdate()).collection;
                queries.push(instructions[modelUpdatesTable]["create-sql"].replace(/#PREFIX\./g,prefix));
                Object.keys(instructions).forEach(function(tableName){
                    queries.push(self.getInsertIntoModelUpdateTableQuery(tableName));
                })
                self.db.executeMultipleUpdates(queries,callback);

            },

            /*
             createAllTablesExceptModelUpdate
             Creates all tables (except for Model-Update) without checking whether they exists or not
             Note that it is presumed the line in Model-update is already set properly
             */
            createAllTablesExceptModelUpdate : function createAllTablesExceptModelUpdate (callback) {
                var queries = [],
                    instructions = this.sqlInstructions,
                    prefix = this.db.getPrefix(),
                    modelUpdatesTable = (new ModelUpdate()).collection;
                Object.keys(instructions).forEach(function(tableName){
                    if (tableName != modelUpdatesTable) {
                        var table = instructions[tableName];
                        queries.push(table["create-sql"].replace(/#PREFIX\./g,prefix));
                        table.updates.forEach(function(update) {
                            update.queries.forEach(function (query) {
                                queries.push(query.replace(/#PREFIX\./g,prefix));
                            });
                        });

                    }
                })
                this.db.executeMultipleUpdates(queries,function() {
                    callback({"created ":Object.keys(instructions).length});
                });
            },

            checkAllTablesExceptModelUpdate : function checkAllTablesExceptModelUpdate (callback) {
                var self =this,
                    instructions = this.sqlInstructions,
                    updateCount = 0;
                    checkTableIsUpToDateCallback = function checkTableIsUpToDateCallback (output) {
                        updateCount += output.updated;
                    }

                Object.keys(instructions).forEach(function(tableName){
                    self.isTableExists(tableName, function (output) {
                        if (output.result != true) {
                            self.createTable(tableName,function () {
                                self.checkTableIsUpToDate (tableName, checkTableIsUpToDateCallback);
                            })
                        } else {
                            self.checkTableIsUpToDate (tableName, checkTableIsUpToDateCallback);
                        }
                    })
                });
                callback({"updated":updateCount});
            },

            checkTableIsUpToDate : function checkTableIsUpToDate (tableName, callback) {
                var self = this,
                    queries = [],
                    prefix = self.db.getPrefix();

                this.db.query("SELECT modified FROM "+this.modelUpdateTableFullName + " WHERE model='"+tableName+"'", function (output){
                    var lastUpdate = output.length ? new Date(output[0].modified) : false;

                        self.sqlInstructions[tableName].updates.forEach(function(update) {
                            if (!lastUpdate || (new Date(update.date)) > lastUpdate) {
                                update.queries.forEach(function (query) {
                                    queries.push(query.replace(/#PREFIX\./g,prefix));
                                });
                            }
                        });

                    queries.push(output.length ? self.getUpdateIntoModelUpdateTableQuery(tableName) : self.getInsertIntoModelUpdateTableQuery(tableName));
                    self.db.executeMultipleUpdates(queries,function() {
                        callback ({"updated":queries.length});
                    });
                });
            }

    };
    })()

    exports.checkDB = MySQLDbAdmin.checkDB.bind(MySQLDbAdmin);
})();