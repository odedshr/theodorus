import dotenv from 'dotenv';
import commandLineArgs  from 'command-line-args';
import { cpus } from 'os';
import forEach from './helpers/forEach.js';

// https://www.npmjs.com/package/command-line-args
const argumentDefinitions = [
    { name: 'debug', alias: 'd', type: Boolean },
    { name: 'src', type: String, multiple: true, defaultOption: true },
    { name: 'timeout', alias: 't', type: Number }
  ],
  configuration = getConfig();

function getConfig() {
  const config = dotenv.config().parsed;

  config.cpuNumber = cpus().length;

  return Object.assign(
    config,
    getDefaultFromPackage(),
    getMySQlConnectionString(),
    commandLineArgs(argumentDefinitions)
  );
}

function getDefaultFromPackage() {
  const variables = {};

  forEach(process.env, (key, variable) => {
    if (key.startsWith('npm_package_')) {
      variables[key.replace(/^npm_package_(config_)?/, '')] = variable;
    }
  })

  return variables;
}

function getMySQlConnectionString() {
  const { dbUser, dbPassword, dbAdmin, dbAdminPassword, dbPort, dbSchema, dbHost } = process.env;

  return (process.env.dbType === 'mysql') ?
    { 
      dbConnectionString: `mysql://${dbUser}:${dbPassword}@${dbHost || 'localhost'}:${dbPort || '3306'}/${dbSchema}`,
      dbConnectionSafeString: `mysql://${dbUser}:******@${dbHost || 'localhost'}:${dbPort || '3306'}/${dbSchema}`,
      dbConnectionObject: { user: dbUser, password: dbPassword, port: dbPort, database: dbSchema, host: dbHost },
      dbAdminConnectionObject: { user: dbAdmin, password: dbAdminPassword, port: dbPort, database: dbSchema, host: dbHost }
    } :
    {};
}

export default configuration;
