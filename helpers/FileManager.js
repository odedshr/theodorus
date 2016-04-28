;(function FileManagerClosure() {
  'use strict';

  var fs = require('fs');
  var folder;

  function init (fileStorageFolder) {
    folder = fileStorageFolder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    return {
      exists: exists,
      get: get,
      set: set
    };
  }

  function exists (fileName) {
    return fs.existsSync(''.concat(folder,'/',fileName));
  }

  function set (fileName, data, callback) {
    var target = ''.concat(folder,'/',fileName);
    var result;
    if (data) {
      var isBase64 = (data.indexOf('data:image/png;base64') === 0 );
      var base64Data = data.replace(/^data:image\/png;base64,/, "");

      result = fs.writeFileSync (target, base64Data, isBase64 ? 'base64' : 'utf8');
    } else if (fs.existsSync(target)) {
      result = fs.unlinkSync (target);
    }
    if (callback !== undefined) {
      callback (result);
    } else {
      return result;
    }
  }

  function get (fileName, callback) {
    fs.readFile(''.concat(folder,'/',fileName), gotFile.bind(null,callback));
  }

  function gotFile (callback, err, file) {
    callback (err? err: file);
  }

  module.exports = init;
})();