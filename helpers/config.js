;(function config() {
    'use strict';

    var variables = require('./default.config.json'),

        getConfig = function getConfig(varName, isRequired) {
            var variable = process.env[varName];
            if (variable === undefined) {
                variable = variables[varName];
            }
            if (variable === undefined) {
                switch (varName) {
                case 'ipAddress':
                    variable = process.env.OPENSHIFT_NODEJS_IP;
                    break;
                case 'port':
                    variable = process.env.OPENSHIFT_NODEJS_PORT;
                    break;
                case 'environment':
                    variable = (getConfig('ipAddress') === '127.0.0.1') ? 'dev' : 'prod';
                break;
                }
            }
            if (variable === undefined && isRequired) {
                throw new Error('The required variable ' + varName + ' was not found. Please fix problem and try again');
            }
            return variable;
        };

    module.exports = getConfig;
})();