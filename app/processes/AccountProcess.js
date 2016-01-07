(function AccountProcessClosure() {
    var io = null;
    var User = (typeof User !== "undefined") ? User : require("../models/User").model();
    var Credentials = (typeof Credentials !== "undefined") ? Credentials : require("../models/Credentials").model();
    var fileSystem = (typeof fileSystem !== "undefined") ? fileSystem : require("fs");
    var _ = (typeof _ !== "undefined") ? _ : require("underscore");
    var AccountProcess = (function () {
        return {
            emailPattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

            init: function (ioFunctions) {
                io = ioFunctions;

                //TODO: this should not run automatically
                var profileImageFolder = io.config.profile_images_folders;
                if (profileImageFolder) {
                    fileSystem.exists(profileImageFolder, function (exists) {
                        if (!exists) {
                            fileSystem.mkdir(profileImageFolder, function (e) {
                                if (e) {
                                    io.log(e,"exception");
                                }
                            });
                        }
                    });
                } else {
                    throw new Error("profileImageFolder-not-defined");
                }
                return this.methods;
            },

            getAccount: function (session, callback) {
                session.useUserAccount(function (user) {
                    user = user ? user : (new User.Account()).toJSON();
                    callback(
                        (session.isJSON) ? user :
                        {
                            "app": {
                                "mode": io.getApplicationMode(),
                                "page": {
                                    "@type": "settings",
                                    "user": user,
                                    "profile": user
                                }
                            }
                        }
                    );
                });
            },

            pGetAccount: function pGetAccount (session, nextHandler, callback) {
                if (session.isJSON) {
                    nextHandler(session, nextHandler, callback);
                } else {
                    nextHandler(session, nextHandler, function (output) {
                        session.useUserAccount (function (user) {
                            output.app = output.app || {} ;
                            output.app.page = output.app.page || {} ;
                            output.app.page.user = ((user ? user : new User.Account()).toJSON());
                            callback(output);
                        });
                    });
                }
            },

            getProfileImage: function getProfileImage(session, callback) {
                var picture = false,
                    locationObject;
                session.useUserAccount(function (user) {
                    if (user) {
                        picture = user.get("picture");
                    }
                    locationObject = {location: picture ? ("profileImage/" + user.get("picture")) : "/ui/img/anonymous.png"};
                    callback(session.isJSON ? locationObject : _.extend(locationObject, {  "directive":"redirect"} ));
                });
            },

            uploadProfileImage: function uploadProfileImage(session, callback) {
                var imageMagick = require('imagemagick');

                session.useUserId(function (userId) {
                    if (userId) {
                        io.db.getAccount(userId, function (user) {
                            var targetFolder = io.config.profile_images_folders,
                                originalFileName = session.input.files.upload.path;

                            if (!originalFileName) {
                                io.log("file upload failed: filename not found", "error");
                                callback(session.getErrorHandler("image-process-failed"));
                            } else if (session.input.files.upload.name.match(/[^\s]+(\.(jpg|png|gif|bmp))$/i)) {
                                imageMagick.identify(originalFileName, function (error, features) {
                                    if (features) {
                                        // session.input.files.upload.name = the original file name
                                        // name should be commmon for user so he might have only one
                                        var targetFileName = io.encrypt("user_" + userId) + "." + features.format.toLowerCase();

                                        imageMagick.crop({
                                            srcPath: originalFileName,
                                            width: Math.min(features.width, features.height),
                                            height: Math.min(features.width, features.height),
                                            quality: 1,
                                            gravity: "Center"
                                        }, function (err, stdout, stderr) {
                                            imageMagick.resize({
                                                srcData: stdout,
                                                dstPath: targetFolder + "/temp-" + targetFileName,
                                                width: 100
                                            }, function (err, stdout, stderr) {
                                                if (err) {
                                                    callback(session.getErrorHandler("image-process-failed"));
                                                } else {
                                                    callback(session.isJSON ? {"image": targetFileName} : {
                                                        "app": {
                                                            "mode": io.getApplicationMode(),
                                                            "page": {
                                                                "@type": "approve-profile-image",
                                                                "image": targetFileName,
                                                                "user": user,
                                                                "referer": session.req.headers.referer
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    } else {
                                        io.log("file upload failed: file analysis failed: " + error, "error");
                                        fileSystem.unlink(originalFileName, function () {
                                            callback(session.getErrorHandler("image-process-failed"));
                                        });
                                    }
                                });
                            } else {
                                io.log("file upload failed: filename invalid (" + JSON.stringify(session.input.files.upload) + ")", "error");
                                fileSystem.unlink(originalFileName, function () {
                                    callback(session.getErrorHandler("image-process-failed"));
                                });
                            }
                        });
                    } else {
                        callback(session.getErrorHandler("no-permission"));
                    }
                });
            },

            approveProfileImage: function uploadProfileImage(session, callback) {
                if (session.input.approve) {
                    session.useUserId(function (userId) {
                        var profileImagesFolder = io.config.profile_images_folders,
                            imageName = session.input.image;
                        if (userId) {
                            fileSystem.rename(profileImagesFolder + "/temp-" + imageName, profileImagesFolder + "/" + imageName, function () {
                            });
                            io.db.getAccount(userId, function (user) {
                                if (user) {
                                    user.set("picture", imageName);
                                    io.db.save(user, function (user) {
                                        if (user) {
                                            callback({  directive: "redirect",
                                                        location: _.unescape(session.input.referer)});
                                        } else {
                                            session.error("approveProfileImage: io.db.save(User)=>user-not-saved" + JSON.stringify(user.toJSON()));
                                        }
                                    });
                                } else {
                                    callback(session.getErrorHandler("no-permission"));
                                }
                            });
                        } else {
                            callback(session.getErrorHandler("no-permission"));
                        }
                    });
                } else {
                    fileSystem.unlink(io.config.profile_images_folders + "/temp-" + session.input.image, function () {
                    });
                    callback({ directive: "redirect",
                               location: _.unescape(session.input.referer)});
                }
            },

            removeProfileImage: function removeProfileImage(session, callback) {
                var onCompletion = function () {
                    callback({ directive: "redirect",
                               location: "referer"});
                };
                session.useUserAccount(function (user) {
                    if (user) {
                        var picture = user.get("picture");
                        if (picture) {
                            io.db.nullify(user, "picture", function () {
                                fileSystem.unlink(io.config.profile_images_folders + "/" + user.get("picture"), function () {
                                });
                                onCompletion();
                            });
                        } else {
                            // user don't have picture anyhow

                            onCompletion();
                        }
                    } else {
                        callback(session.getErrorHandler("no-permission"));
                    }
                });
            },

            isNameExists: function (session, callback) {
                io.db.getUserByName(session.input.display_name, function (result) {
                    callback((result ? {"result": "name-is-available"} : {"result": "name-in-use"}));
                });
            },

            getSignInPage: function (session, callback) {
                var input = session.input ? session.input : {};

                callback({
                    "app": {
                        "mode": io.getApplicationMode(),
                        "page": {
                            "@type": "signin",
                            "name": input.name,
                            "email": input.email,
                            "referer": session.referer
                        }
                    }
                });
            },

            // 1
            getEmailConfirmationPage: function (session, callback) {
                var input = session.input ? session.input : {},
                    pageType = "confirm-email";

                if (input.hash) {
                    // TODO: check if hash is valid
                    pageType = "signup";
                }
                callback({
                    "app": {
                        "mode": io.getApplicationMode(),
                        "page": {
                            "@type": pageType,
                            "name": input.name,
                            "email": input.email,
                            "referer": session.req.headers.referer
                        }
                    }
                });
            },

            // 2 + 6
            signUp: function signUp(session, callback) {
                if (session.input && !session.input.password) {
                    this.sendConfirmationEmail(session, callback);
                } else {
                    this.finalizeSignUp(session, callback);
                }
            },

            // 3
            sendConfirmationEmail: function sendConfirmationEmail (session, callback) {
                var input = session.input ? session.input : {},
                    email = input.email,
                    onFinish = function onFinish(pageType) {
                        callback({
                            "app": {
                                "mode": io.getApplicationMode(),
                                "page": {
                                    "@type": pageType,
                                    "email": input.email,
                                    "referer": session.req.headers.referer
                                }
                            }
                        });
                    };

                if (!this.emailPattern.test(email)) {
                    callback(session.getErrorHandler("email-is-invalid", "email", email));
                } else {
                    io.db.getCredentials(email, function (result) {
                        var sendMail = function sendMail() {
                            io.mail ({  emailTo: email,
                                        emailTemplate: "email-confirm",
                                        emailData: {    server: session.server,
                                        link:   "/confirm/" + email + "/" + io.encrypt("confirm" + email)
                            }}, function (){
                                onFinish("confirm-email-sent");
                            });
                        };

                        if (result) {
                            // email already exists. but is in use? check if already have a password
                            if (result.get("password")) {
                                callback(session.getErrorHandler("user-already-activated", "email", email));
                            } else {
                                // this email was created before, but not yet activated.
                                // don't create a new one, just send the mail
                                sendMail();
                            }
                        } else {
                            try {
                                var credentials = new Credentials({ "auth_key": email });
                                io.db.save(credentials, function () {
                                    sendMail();
                                });
                            } catch (err) {
                                session.error("sendConfirmationEmail: io.db.save(User).callback=>" + err);
                                callback(session.getErrorHandler("operation-failed", "email", email));
                            }


                        }
                    });
                }
            },

            // 5
            getEmailConfirmedPage: function getEmailConfirmedPage (session, callback) {
                var urlSplit = session.url.split("/"),
                    email = urlSplit[2],
                    confirmation =urlSplit[3];
                if (confirmation == io.encrypt("confirm" + email)) {
                    io.db.getCredentials(email, function (credential) {
                        if (credential.get("password")) {
                            callback(session.getErrorHandler("user-already-activated","email",email));
                        } else {
                            callback({
                                "app": {
                                    "mode": io.getApplicationMode(),
                                    "page": {
                                        "@type": "signup",
                                        "email": email
                                    }
                                }
                            });
                        }
                    });
                } else {
                    callback(session.getErrorHandler("email-confirmation-invalid","email",email));
                }
            },

            // 7
            finalizeSignUp: function createCredentials (session, callback) {
                var input = session.input,
                    name = input.name,
                    email = input.email,
                    password = input.password,
                    passwordRepeat = input.password_repeat,
                    error = false,
                    throwError = function (errorMessage, comment) {
                        if (comment) {
                            session.error("finalizeSignUp: " + comment, error);
                        }
                        callback(session.isJSON ?
                        {error: errorMessage} : {
                            "app": {
                                "mode": io.getApplicationMode(),
                                "message": {
                                    "@type": "error",
                                    "@message": errorMessage
                                },
                                "page": {
                                    "@type": "signup",
                                    "name": name,
                                    "password":input.password,
                                    passwordRepeat:input.password_repeat,
                                    "terms_of_use":"true"
                                },
                                "signup": {
                                    "email": input.email
                                }
                            } });
                        return false;
                    };

                if ("true" != input.md5) {
                    if (password.length <= io.config.minimum_password_length) {
                        return throwError("password-too-short");
                    } else {
                        password = io.encrypt(password);
                        passwordRepeat = io.encrypt(passwordRepeat);
                    }
                }
                if (password != passwordRepeat) {
                    return throwError("passwords-dont-match");
                } else if (name.length <= io.config.minimum_display_name_length) {
                    return throwError("name-too-short");
                } else if (input.terms_of_use != "true" && input.terms_of_use != "on") {
                    return throwError("terms-of-use-not-approved");
                } else {
                    io.db.getUserByName(name, function (result) {
                        if (result) {
                            return throwError("name-in-use");
                        }
                        var user = new User({"display_name": name, "permissions": User.initialPermissions});
                        io.db.save(user,
                            function (user) {
                                try {
                                    if (!user) {
                                        return throwError ("operation-failed","failed to save user");
                                    }
                                    var userId = user.get("user_id");
                                    io.db.getCredentials(email, function (credential) {
                                        if (!credential) {
                                            return throwError("operation-failed","finalizeSignUp: failed to get credential");
                                        }
                                        credential.set({"user_id":userId, "password": password });
                                        io.db.save(credential, function(credential){
                                            if (!credential) {
                                                return throwError("operation-failed","finalizeSignUp: failed to save credential");
                                            }
                                            session.cookie(userId, false);
                                            if (session.isJSON) {
                                                callback({"result": user.toJSON()});
                                            } else {
                                                callback({  directive: "redirect",
                                                            location: "/"});
                                            }
                                        });
                                    });
                                } catch (err) {
                                    return throwError("operation-failed", "finalizeSignUp.save(User).callback=>" + err);
                                }

                            }
                        );
                    }); // io.db.getUserByName
                }
            },

            authenticate: function (session, callback) {
                var input = session ? session.input : false,
                    throwError = function () {
                        var errorMessage = "bad-credentials";
                        callback(session.isJSON ?
                        {error: {"error": errorMessage}} : {
                            "app": {
                                "mode": io.getApplicationMode(),
                                "message": { "@type": "error",
                                    "@message": errorMessage
                                },
                                "page": {
                                    "@type": "signin",
                                    "email": input.email,
                                    "referer": input.referer ? _.unescape(session.input.referer) : session.req.headers.referer
                                }
                            }
                        });
                    };
                if (!input || (typeof input === "undefined")) {
                    throwError();
                } else {
                    var email = input.email;
                    var password = input.password;
                    if (!email || email.length === 0 || !password) {
                        throwError();
                    } else {
                        if ("true" != ( input.md5 + "")) {
                            if (password.length === 0) {
                                throwError();
                            } else {
                                password = io.encrypt(password);
                            }
                        }

                        io.db.getCredentials(email, function (credentials) {
                            if (!credentials) { // email not listed
                                throwError();
                            } else {
                                if (credentials.get("password") != password) {
                                    throwError();
                                } else {
                                    //TODO: write last login date
                                    var userId = credentials.get("user_id");
                                    session.cookie(userId, input.remember);
                                    io.db.getAccount(userId, function (user) {
                                        if (session.isJSON) {
                                            callback((user ? user : new User()).toJSON());
                                        } else {
                                            callback({  directive: "redirect",
                                                        location: "/"});
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            },

            signOut: function (session, callback) {
                session.cookie("", false);
                callback(session.isJSON ? {} : {
                    "app": {
                        "mode": io.getApplicationMode(),
                        "page": {
                            "@type": "signout"
                        }
                    }
                });
            },

            getResetPasswordPage: function getResetPasswordPage (session, callback) {
                callback({
                    "app": {
                        "mode": io.getApplicationMode(),
                        "page": {
                            "@type": "forgot-password"
                        }
                    }
                });
            },

            sendResetPasswordEmail: function sendResetPasswordEmail (session, callback) {
                var input = session.input || {},
                    email = input.email;

                io.db.getCredentials(email, function (credential) {
                    if (credential) {
                        io.mail({ emailTo: email,
                                  emailTemplate: "reset-password",
                                  emailData: {    server: session.server,
                                  link:   "/resetPassword/" + email + "/" + io.encrypt("reset" + email)
                            }
                        }, function (){
                            var message = "reset-email-sent";
                            if (session.isJSON) {
                                callback({"result":message});
                            } else {
                                io.executeHandler(session.res,session,io.getHandler("get","/signin"),function (signInPage) {
                                    signInPage.app = signInPage.app || {};
                                    signInPage.app.message = {
                                        "@type": "info",
                                        "@message": message
                                    };
                                    callback(signInPage);
                                });
                            }
                        });
                    } else {
                        var message = "email-is-unknown";
                        callback(session.isJSON ?
                        {error: {"error": message}} : {
                            "app": {
                                "mode": io.getApplicationMode(),
                                "message": { "@type": "error",
                                    "@message": message
                                },
                                "page": {
                                    "@type": "forgot-password",
                                    "email": input.email,
                                    "hash": input.hash
                                }
                            }
                        });
                    }
                });
            },

            passwordResetConfirmation: function passwordResetConfirmation (session, callback) {
                var urlSplit = session.url.split("/"),
                    email = urlSplit[2],
                    confirmation =urlSplit[3];
                if (confirmation == io.encrypt("reset" + email)) {
                    io.db.getCredentials(email, function (credential) {
                        if (credential) {
                            callback({
                                "app": {
                                    "mode": io.getApplicationMode(),
                                    "page": {
                                        "@type": "change-password",
                                        "email": email,
                                        "hash": confirmation
                                    }
                                }
                            });
                        } else {
                            callback(session.getErrorHandler("email-confirmation-invalid","email",email));
                        }
                    });
                } else {
                    callback(session.getErrorHandler("email-confirmation-invalid","email",email));
                }
            },

            getUpdatePasswordPage: function getUpdatePasswordPage (session, callback) {
                session.useUserId(function(userId) {
                    if (userId) {
                        io.db.getCredentialsByUserId(userId, function (credential) {
                            callback({
                                "app": {
                                    "mode": io.getApplicationMode(),
                                    "page": {
                                        "@type": "change-password",
                                        "email": credential.get("auth_key")
                                    }
                                }
                            });
                        });
                    } else {
                        io.log("updatePassword : no user-id found", "error");
                        io.executeHandler(session.res,session,io.getHandler("get","/signin"),function (nextPage) {
                            nextPage.app = nextPage.app || {};
                            nextPage.app.message = {
                                "@type": "error",
                                "@message": "bad-credentials"
                            };
                            callback(nextPage);
                        });
                    }
                });
            },

            updatePassword: function updatePassword (session, callback) {
                var input = session.input || {},
                    email = input.email,
                    hash = input.hash,
                    oldPassword = input.old_password,
                    password = input.password,
                    passwordRepeat = input.password_repeat,
                    onCredentialLoaded = function onCredentialLoaded (credential) {
                        if (credential) {
                            if (!hash && (credential.get("password") != io.encrypt(oldPassword))){
                                return throwError("old-password-is-wrong","change-password");
                            } else if (hash && (hash != io.encrypt("reset" + email))) {
                                return throwError("email-confirmation-invalid","forgot-password");
                            } else if ("true" != input.md5) {
                                if (password.length <= io.config.minimum_password_length) {
                                    return throwError("password-too-short", "reset-password");
                                } else {
                                    password = io.encrypt(password);
                                    passwordRepeat = io.encrypt(passwordRepeat);
                                }
                            }
                            if (password != passwordRepeat) {
                                return throwError("passwords-dont-match");
                            }
                            credential.set("password", password);
                            io.db.save(credential, function () {
                                onFinish ("password-changed");
                            });

                        } else {
                            return throwError("email-is-unknown");
                        }
                    },
                    throwError = function throwError (errorMessage) {
                        callback(session.isJSON ?
                        {error: {"error": errorMessage}} : {
                            "app": {
                                "mode": io.getApplicationMode(),
                                "message": { "@type": "error",
                                    "@message": errorMessage
                                },
                                "page": {
                                    "@type": "change-password",
                                    "email": input.email,
                                    "hash": input.hash
                                }
                            }
                        });
                        return false;
                    },
                    onFinish = function onFinish (message) {
                        if (session.isJSON) {
                            callback({"result":message});
                        } else {
                            io.executeHandler(session.res,session,io.getHandler("get", hash ? "/signin" : "/me"),function (nextPage) {
                                nextPage.app = nextPage.app || {};
                                nextPage.app.message = {
                                    "@type": "info",
                                    "@message": message
                                };
                                callback(nextPage);
                            });
                        }
                    };

                if (oldPassword || (hash == io.encrypt("reset" + email))){
                    io.db.getCredentials(email, onCredentialLoaded);
                } else {
                    return throwError("operation-failed");
                }

            }
        };
    }());

    AccountProcess.methods = [
        {"method": "GET", "url": "/signin", "handler": AccountProcess.getSignInPage.bind(AccountProcess)},
        {"method": "POST", "url": "/signin", "handler": AccountProcess.authenticate.bind(AccountProcess)},
        {"method": "POST", "url": "/user/exists", "handler": AccountProcess.isNameExists.bind(AccountProcess)},
        {"method": "GET", "url": "/signup", "handler": AccountProcess.getEmailConfirmationPage.bind(AccountProcess)},
        {"method": "GET", "url": /\/confirm\/[0-9a-zA-Z\.\-_@]+\/[0-9a-zA-Z]+\/?$/, "handler": AccountProcess.getEmailConfirmedPage.bind(AccountProcess)},
        {"method": "POST", "url": "/signup", "handler": AccountProcess.signUp.bind(AccountProcess)},
        {"method": "GET", "url": "/signout", "handler": AccountProcess.signOut.bind(AccountProcess)},

        {"method": "GET", "url": "/me", "handler": AccountProcess.getAccount.bind(AccountProcess)},
        {"method": "DELETE", "url": "/me", "handler": AccountProcess.signOut.bind(AccountProcess)},

        {"method": "GET", "url": "/profileImage", "handler": AccountProcess.getProfileImage.bind(AccountProcess)},
        {"method": "POST", "url": "/profileImage", "handler": AccountProcess.uploadProfileImage.bind(AccountProcess)},
        {"method": "POST", "url": "/profileImage/approve", "handler": AccountProcess.approveProfileImage.bind(AccountProcess)},
        {"method": "GET", "url": "/profileImage/remove", "handler": AccountProcess.removeProfileImage.bind(AccountProcess)},
        {"method": "DELETE", "url": "/profileImage", "handler": AccountProcess.removeProfileImage.bind(AccountProcess)},

        {"method": "GET", "url": "/resetPassword", "handler": AccountProcess.getResetPasswordPage.bind(AccountProcess)},
        {"method": "POST", "url": "/resetPassword", "handler": AccountProcess.sendResetPasswordEmail.bind(AccountProcess)},
        {"method": "GET", "url": /\/resetPassword\/[0-9a-zA-Z\.\-_@]+\/[0-9a-zA-Z]+\/?$/, "handler": AccountProcess.passwordResetConfirmation.bind(AccountProcess)},
        {"method": "GET", "url": "/password", "handler": AccountProcess.getUpdatePasswordPage.bind(AccountProcess)},
        {"method": "POST", "url": "/password", "handler": AccountProcess.updatePassword.bind(AccountProcess)},

        {"method": "GET", "url": [
            /^\/(:\d+\/?)?$/,
            /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,
            /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,
            /^\/topics\/add\/?$/,
            /^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/
            ], "pipe": AccountProcess.pGetAccount.bind(AccountProcess)},
        {"method": "POST","url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/, "pipe": AccountProcess.pGetAccount.bind(AccountProcess)}
    ];

    if (typeof exports !== "undefined") {
        exports.init = AccountProcess.init.bind(AccountProcess);
    }
})();