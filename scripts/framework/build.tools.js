//cSpell:words backend
;(function buildToolsEnclosure() {
  'use strict';

  var fs = require('fs'),
      logger = require('../../src/backend/helpers/logger.js');

  //------------------------------------------------------------------------------------------------

  function getScriptFileList(config, mask) {
    var compileSrcFullPath = config.source + '/' + config.compileSource,
        initJsFileFullPath = compileSrcFullPath + '\/' + config.initJsFile,
        reAllJSExceptAppLoader = new RegExp('^(?!' + initJsFileFullPath + ').*\\.js$'),
        files = getFileList(config.source + '/' +
                            config.compileSource,
                            { mask: (mask ? mask : ''),
                              filter: reAllJSExceptAppLoader });

    // config.initJsFile is the name of the js file that should be loaded before
    // all other modules. Name includes only filename with no extension.
    if (fs.existsSync(initJsFileFullPath + '.js')) {
      files.unshift(initJsFileFullPath.replace(mask, '') + '.js');
    }

    return files;
  }

  //------------------------------------------------------------------------------------------------

  function getFileList(folder, options) {
    var files = fs.readdirSync(folder),
        output = [],
        curPath;

    if (options === undefined) {
      options = {};
    }

    if (options.mask === undefined) {
      options.mask = '';
    }

    while (files.length) {
      curPath = folder + '/' + files.pop();

      if (fs.lstatSync(curPath).isDirectory()) {
        output = output.concat(getFileList(curPath, options));
      } else if (options.filter === undefined ||
                curPath.match(options.filter) !== null) {
        output.push(curPath.replace(options.mask, ''));
      }
    }

    return output;
  }

  //------------------------------------------------------------------------------------------------

  function ensureEmptyFolder(path) {
    if (!fs.existsSync(path)) {
      ensureFolderExistence(path);
    } else if (fs.lstatSync(path).isDirectory()) {
      fs.readdirSync(path).forEach(function perFile(file) {
        if (fs.existsSync(file)) {
          if (fs.lstatSync(file).isDirectory()) {
            deleteFolderRecursive(path + '/' + file);
          } else {
            fs.unlinkSync(file);
          }
        }
      });
    } else {
      throw new Error('folder name is already taken');
    }
  }

  function deleteFolderRecursive(path) {
    var curPath;

    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file) {
        curPath = path + '/' + file;

        if (fs.lstatSync(curPath).isDirectory()) { // recursive
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  function isFolderExists(path) {
    return fs.existsSync(path);
  }

  //------------------------------------------------------------------------------------------------

  function ensureFolderExistence(folder) {
    var folders = folder.replace(/^\.\//, '').split('/'),
        path = '.';

    folders.forEach(function perFolder(folder) {
      path += '/' + folder;

      if (!isFolderExists(path)) {
        fs.mkdirSync(path);
      }
    });
  }

  function getFolderOfFile(file) {
    var folders = file.split('/');

    folders.pop();

    return folders.join('/');
  }
  //------------------------------------------------------------------------------------------------

  function onError(err) {
    if (err) {
      throw err;
    }
  }

  //------------------------------------------------------------------------------------------------

  function execAndLogMethod(method) {
    var time = new Date(),
        methodName = method.name.replace(/bound /g, '');

    logger('Starting ' + logger.color.cyan + methodName + logger.color.reset + '...');

    method();
    logger('Finished ' + logger.color.cyan + methodName + logger.color.reset +
           ' (' + logger.color.green + (Date.now() - time.getTime()) / 1000, 's' +
                  logger.color.reset + ')');
  }

  //------------------------------------------------------------------------------------------------

  module.exports = {
    ensureEmptyFolder: ensureEmptyFolder,
    ensureFolderExistence: ensureFolderExistence,
    getFolderOfFile: getFolderOfFile,
    isFolderExists: isFolderExists,
    getFileList: getFileList,
    getScriptFileList: getScriptFileList,
    onError: onError,
    execAndLogMethod: execAndLogMethod
  };
})();
