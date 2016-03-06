(function userControllerClosure() {
    'use strict';

    var md5 = require ('md5');
    var Encryption = require ('../helpers/Encryption.js');
    var validators = require('../helpers/validators.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var models = require('../helpers/models.js');

    function load (email, password, db, onSuccess, onError) {
        tryCatch(function tryCatchLoad() {
            db.user.one({email:email}, loadOnFound.bind(null, password, onSuccess, onError) );
        },onError);
    }
    function loadOnFound (password,onSuccess, onError, err, user) {
        tryCatch(function tryCatchLoadOnFound() {
            if (err) {
                onError(new Error(err));
            } else if (user === null) {
                onError (new Error(404));
            } else if (((password !== false) && user.password !== md5(password)) || (user.status === models.user.status.archived)) {
                onError (new Error(401));
            } else {
                onSuccess(user);
            }
        },onError);
    }
    function onSaved (callback, err) {
        callback(err ? new Error(err) : true);
    }

    function signin (email, password, authToken, db, callback) {
        tryCatch(function tryCatchSignin() {
            load (email, password, db, signinOnLoaded.bind(null,authToken, callback), callback);
        },callback);
    }
    function signinOnLoaded (authToken, callback, user) {
        tryCatch(function tryCatchSigninOnLoaded() {
            authToken.user = {
                id : user.id,
                email: user.email,
                lastLogin: user.lastLogin
            };
            user.lastLogin = new Date();
            user.save(function (err) {
                callback(err ? (new Error(err)) : Encryption.encode(JSON.stringify(authToken)));
            });
        },callback);
    }
    function signup(email, password, authToken, db, callback) {
        if (email === undefined || !validators.isValidEmail(email)) {
            callback (new Error ('email-invalid'));
        }
        if (password === undefined || !validators.isValidPassword(password)) {
            callback (new Error ('password-invalid'));
        }
        exists(email, db, signUpOnCheckIfExists.bind(null, email, password, authToken, db, callback) );
    }
    function signUpOnCheckIfExists (email, password, authToken, db, callback, isExists) {
        if (isExists instanceof Error) {
            callback(isExists);
        } else if (isExists) {
            callback(new Error(409));
        } else {
            var now = new Date();
            var oUser = {
                email: email,
                password: md5(password),
                status: models.user.status.active,
                created: now,
                modified: now,
                lastLogin: now
            };
            authToken.user = {
                email: email
            };
            db.user.create(oUser, signUpOnCreated.bind(null, authToken, callback));
        }
    }
    function signUpOnCreated (authToken, callback, err,user) {
        if (err) {
            callback (new Error(err));
        } else {
            authToken.user.id = user.id;
            callback(Encryption.encode(JSON.stringify(authToken)));
        }
    }
    function archive(authUser, db,  callback ) {
        db.user.get(authUser.id, archiveOnLoaded.bind(null, callback));
    }

    function archiveOnLoaded(db,  callback, user) {
        tryCatch(function tryCatchRemoveOnLoaded (callback, err, user) {
            if (err) {
                callback (new Error(err));
            } if (user === null) {
                callback (new Error(404));
            } else {
                user.status = models.user.status.archived;
                user.modified = new Date();
                user.save(onSaved.bind(null,callback));
            }
        }, callback);
    }

    function remove(authUser, db,  callback ) {
        db.user.get(authUser.id, removeOnLoaded.bind(null, callback));
    }
    function removeOnLoaded(callback, err, user) {
        tryCatch(function tryCatchRemoveOnLoaded () {
            if (err) {
                callback (new Error(err));
            } else if (user === null) {
                callback (new Error(404));
            } else {
                user.remove(onSaved.bind(null,callback));
            }
        }, callback);
    }

    function exists(email, db, callback) {
        db.user.exists({email:email}, existsOnFound.bind(null,callback) );
    }
    function existsOnFound (callback, err, isExists) {
        callback(err ? new Error(err) : isExists);
    }

    function generateResetPasswordToken(email, db, callback) {
        load (email, false, db, generateResetPasswordTokenOnLoaded.bind(null, email, callback));
    }
    function generateResetPasswordTokenOnLoaded (email, callback, user) {
        callback(Encryption.encode(JSON.stringify({
            email: email,
            lastLogin: user.lastLogin.toString(),
            modified: user.modified.toString()
        })));
    }

    function resetPassword(email, token, newPassword, db, callback) {
        var decryptedToken = JSON.parse(Encryption.decode(token));
        if (decryptedToken.email !== email) {
            callback (new Error(404));
        }
        load (email, false, db, resetPasswordOnLoaded.bind(null,decryptedToken,newPassword, callback), callback);
    }
    function resetPasswordOnLoaded (decryptedToken,newPassword, callback, user) {
        if ((decryptedToken.lastLogin !== user.lastLogin.toString()) || (decryptedToken.modified !== user.modified.toString())) {
            callback (new Error(403));
        }
        user.password = md5(newPassword);
        user.modified = new Date();
        user.save(function saved (err) {
            callback(err ? new Error(err) : true);
        });
    }

    function changePassword(authUser, oldPassword, newPassword, db, callback) {
        db.user.get(authUser.id, changePasswordOnLoaded.bind(null, oldPassword, newPassword, callback));
    }
    function changePasswordOnLoaded(oldPassword, newPassword, callback, err, user) {
        tryCatch(function tryCatchChangePasswordOnLoaded() {
            if (err) {
                callback (new Error(err));
            } else if (user.password !== md5(oldPassword)) {
                callback (new Error(401));
            } else if (user === null ) {
                callback (new Error(404));
            } else {
                user.password = md5(newPassword);
                user.modified = new Date();
                user.save(function saved (err) {
                    callback(err ? new Error(err) : true);
                });
            }
        }, callback);
    }

    function update (authUser, birthDate, isFemale, db, callback) {
        db.user.get(authUser.id, updateOnLoaded.bind(null, birthDate, isFemale, callback));
    }
    function updateOnLoaded (birthDate, isFemale, callback, err, user) {
        tryCatch(function tryCatchChangePasswordOnLoaded() {
            if (err) {
                callback (new Error(err));
            } else if (user === null ) {
                callback (new Error(404));
            } else if (birthDate === undefined && isFemale === undefined) {
                callback(new Error('nothing-changed'));
            } else {
                if (birthDate !== undefined) {
                    user.birthDate = new Date(birthDate);
                }
                if (isFemale !== undefined) {
                    user.isFemale = JSON.parse(isFemale);
                }
                user.modified = new Date();
                user.save(function saved (err) {
                    callback(err ? new Error(err) : true);
                });
            }
        }, callback);
    }

    exports.signin = signin;
    exports.signup = signup;
    exports.archive = archive;
    exports.remove = remove;
    exports.exists = exists;
    exports.generateResetPasswordToken = generateResetPasswordToken;
    exports.resetPassword = resetPassword;
    exports.changePassword = changePassword;
    exports.update = update;

})();