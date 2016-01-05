;(function () {
    var md5 = require('md5');
    var fs = require('fs');
    var userController = require('../controllers/userController.js');
    var config = require ('../helpers/config.js');
    var db = require ('../helpers/db.js');
    var testId = (new Date()).getTime();
    var dbName = 'test'+testId+'.db';
    var testPassword = 'password1';
    var testPassword2 = 'password2';
    var dbModels = false;

    function before (done) {
        db.connect('sqlite://'+dbName, function getModels(newModels) {
            dbModels = newModels;
            done();
        });
    }

    function after (done) {
        fs.unlink(testSuiteName+dbName,done);
    }
    function getTestUsername (testName) {
        return 'tstCtrl'+testId+'+'+testName+'@theodorus.com';
    }

    function removeAllTestsArtifcats (dbModels, callback) {
        dbModels.user.find({password:[md5(testPassword),md5(testPassword2)]}, function (err,users) {
            if (err) {
                throw err;
            }
            users.forEach (function (user) {
                user.remove();
            });
            if (callback !== undefined) {
                callback();
            }
        });
    }

    function createUser (dbModels, email, password, onSuccess, onError) {
        userController.signup(email, password, {}, dbModels, onResponse.bind(null,onSuccess,onError));
    }
    function onResponse (onSuccess, onError, response) {
        if (response instanceof Error) {
            onError(response);
        } else {
            onSuccess(response);
        }
    }
    function removeUser (dbModels, token, onSuccess, onError) {
        userController.remove(token, dbModels, onResponse.bind(null,onSuccess,onError));
    }
    function signinUser (dbModels, email, password,onSuccess,onError) {
        userController.signin(email, password, {}, dbModels, onResponse.bind(null,onSuccess,onError));
    }
    function exists (dbModels, email,onSuccess,onError) {
        userController.exists(email, dbModels, onResponse.bind(null,onSuccess,onError));
    }

    function getDBModels (callback) {
        if (dbModels) {
            callback (dbModels);
        } else {
            before(function () {
                    callback (dbModels);
            });
        }
    }
    function cleanTestEnvironment (callback) {
        callback();
    }
    module.exports.getTestUsername = getTestUsername;
    module.exports.removeAllTestsArtifcats = removeAllTestsArtifcats;
    module.exports.createUser = createUser;
    module.exports.removeUser = removeUser;
    module.exports.signinUser = signinUser;
    module.exports.exists = exists;
    module.exports.getDBModels = getDBModels;
    module.exports.cleanTestEnvironment = cleanTestEnvironment;
})();