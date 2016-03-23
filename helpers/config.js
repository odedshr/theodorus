;(function config() {
    'use strict';

    var variables = require('./default.config.json'),

        getConfig = function getConfig(varName, isRequired) {
            var variable = process.env[varName];
            if (variable === undefined) {
                switch (varName) {
                case 'ipAddress':
                    variable = process.env.OPENSHIFT_NODEJS_IP;
                    break;
                case 'port':
                    variable = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || variables.port;
                    break;
                case 'dbConnectionString':
                    if (variable === undefined) {
                        if (process.env.THEODORUS_MYSQL_HOST) {
                            var host = process.env.THEODORUS_MYSQL_HOST;
                            var password = process.env.THEODORUS_MYSQL_PASSWORD;
                            var port = process.env.THEODORUS_MYSQL_PORT;
                            var schema = process.env.THEODORUS_MYSQL_SCHEMA;
                            var user = process.env.THEODORUS_MYSQL_USER;
                            variable = ''.concat('mysql://',user,':',password,'@',host,':',port,'/',schema);
                        } else {
                            variable = variables.dbConnectionString;
                        }
                    }
                    break;
                case 'environment':
                    variable = (getConfig('ipAddress') === '127.0.0.1') ? 'dev' : 'prod';
                break;
                case 'storedFilesFolder':
                    variable = process.env.OPENSHIFT_DATA_DIR;
                    if (variable === undefined) {
                        variable = variables.storedFilesFolder;
                    }
                break;
                }
            }
            if (variable === undefined) {
                variable = variables[varName];
            }
            if (variable === undefined && isRequired) {
                throw new Error('The required variable ' + varName + ' was not found. Please fix problem and try again');
            }
            return variable;
        };

    module.exports = getConfig;
})();