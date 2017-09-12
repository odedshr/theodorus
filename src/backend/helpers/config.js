// ccSpell:words OPENSHIFT, THEODORUS
;(function config() {
  'use strict';

  var variables = getDefaultVariablesFromPackageJson();

  module.exports = getConfig;

  function getDefaultVariablesFromPackageJson() {
    var variables = {},
        key;

    for (key in process.env) {
      if (key.indexOf('npm_package_') === 0 &&
          key.substr(12).indexOf('_') === -1) {
        variables[key.substr(12)] = process.env[key];
      } else if (key.indexOf('npm_package_config_') === 0) {
        variables[key.substr(19)] = process.env[key];
      }
    }

    return variables;
  }

  function getConfig(varName, isRequired) {
    var variable = process.env[varName];

    if (variable === undefined) {
      switch (varName) {
        case 'ipAddress':
          variable = process.env.OPENSHIFT_NODEJS_IP;
          break;
        case 'port':
          variable = process.env.OPENSHIFT_NODEJS_PORT ||
                    process.env.PORT ||
                    variables.port;
          break;
        case 'dbConnectionString':
          if (variable === undefined) {
            if (process.env.THEODORUS_MYSQL_HOST) {
              variable = getMySQlConnectionString();
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
        case 'defaultOrigin':
          variable = process.env.THEODORUS_ORIGIN_DEFAULT;
          break;
      }
    }

    if (variable === undefined) {
      variable = variables[varName];
    }

    if (variable === undefined && isRequired) {
      throw new Error('The required variable ' + varName +
                      ' was not found. Please fix problem and try again');
    }

    return variable;
  }

  function getMySQlConnectionString() {
    var host = process.env.THEODORUS_MYSQL_HOST,
        password = process.env.THEODORUS_MYSQL_PASSWORD,
        port = process.env.THEODORUS_MYSQL_PORT,
        schema = process.env.THEODORUS_MYSQL_SCHEMA,
        user = process.env.THEODORUS_MYSQL_USER;

    return 'mysql://' + user + ':' + password + '@' + host + ':' + port + '/' + schema;
  }
})();
