;(function buildToolsEnclosure() {
  var fs = require('fs');

  var color = require('./console-colour.js');
  //------------------------------------------------------------------------------------------------

  function getFileList(folder, options) {
    var files = fs.readdirSync(folder);
    var output = [];
    if (options === undefined) {
      options = {};
    }
    if (options.mask === undefined) {
      options.mask = '';
    }

    while (files.length) {
      var curPath = folder + '/' + files.pop();
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
      fs.mkdirSync(path);
    } else if (fs.lstatSync(path).isDirectory()) {
      fs.readdirSync(path).forEach(function perFile(file) {
        if (fs.existsSync(file)) {
          if (fs.lstatSync(file).isDirectory()) {
            deleteFolderRecursive(path+'/'+file);
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
    if( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
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

  function ensureFolderExistance(rootFolder, item) {
    var folders = item.split('/');
    var path = rootFolder;
    folders.shift(); // items starts with '/' so first item is empty string
    folders.pop(); // pop the file itself
    folders.forEach(function perFolder(folder) {
      path += '/' + folder;

      if (!isFolderExists(path)) {
        fs.mkdirSync(path);
      }
    });
  }
  //------------------------------------------------------------------------------------------------

  function onError(err) {
    if (err) {
      throw err;
    }
  }

  //------------------------------------------------------------------------------------------------

  function getFormattedTime(time) {
    return time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
  }

  function execAndLogMethod(method) {
    var time = new Date();
    var methodName = method.name.replace(/bound /g, '');
    console.log('[' + color.blue + getFormattedTime(time) +
                      color.reset + '] starting ' +
                      color.cyan + methodName +
                      color.reset + '...');
    method();
    console.log('[' + color.blue + getFormattedTime(time) +
                      color.reset + '] finished ' +
                      color.cyan + methodName, ' (' +
                      color.green + (Date.now() - time.getTime()) / 1000, 's' +
                      color.reset + ')' +
                      color.reset);
  }

  //------------------------------------------------------------------------------------------------

  module.exports = {
    ensureEmptyFolder: ensureEmptyFolder,
    ensureFolderExistance: ensureFolderExistance,
    isFolderExists: isFolderExists,
    getFileList: getFileList,
    onError: onError,
    execAndLogMethod: execAndLogMethod
  };
})();
