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
        var base64Data = data.replace(/^data:image\/png;base64,/, "");

        fs.writeFile(''.concat(folder,'/',fileName), base64Data, 'base64', callback);
    }

    function get (fileName, callback) {
        fs.readFile(''.concat(folder,'/',fileName), gotFile.bind(null,callback));
    }

    function gotFile (callback, err, file) {
        callback (err? err: file);
    }

    module.exports = init;
})();