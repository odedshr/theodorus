var io = null,
    User = (typeof User !== "undefined") ? User : require("../models/User").model(),
    Credentials = (typeof Credentials !== "undefined") ? Credentials : require("../models/Credentials").model();

var AccountProcess = (function () {
    return {
        emailPattern : /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

        init : function (ioFunctions) {
            io = ioFunctions;
            var methods = []; //I'm using push because of an annoying compiler warning
            methods.push({"method":"GET",   "url":"/signin",        "handler":AccountProcess.getSignInPage.bind(AccountProcess)});
            methods.push({"method":"POST",  "url":"/signin",        "handler":AccountProcess.authenticate.bind(AccountProcess)});
            methods.push({"method":"POST",  "url":"/user/exists",   "handler":AccountProcess.isNameExists.bind(AccountProcess)});
            methods.push({"method":"GET",   "url":"/signup",        "handler":AccountProcess.getSignUpPage.bind(AccountProcess)});
            methods.push({"method":"POST",  "url":"/signup",        "handler":AccountProcess.createCredentials.bind(AccountProcess)});
            methods.push({"method":"GET",   "url":"/signout",       "handler":AccountProcess.getSignOutPage.bind(AccountProcess)});

            methods.push({"method":"GET",   "url":"/me",            "handler":AccountProcess.getAccount.bind(AccountProcess)});
            methods.push({"method":"DELETE","url":"/me",            "handler":AccountProcess.signOut.bind(AccountProcess)});
            return methods;
        },

        getAccount: function (session,callback) {
            session.useUserId(function(userId){
                if (userId){
                    io.db.getAccount(userId,function (user) {
                        callback((user ? user : new User()).toJSON());
                    });
                }  else {
                    callback((new User.Account()).toJSON());
                }
            });
        },

        isNameExists: function (session,callback) {
            io.db.getUserByName(session.input.display_name, function (result) {
                callback((result ? {"result":"name-is-available"} : {"result":"name-in-use"}));
            });
        },

        getSignInPage: function  (session,callback) {
            var input = session.input ? session.input : {};

            callback({
                "app":{
                    "mode": io.getTheodorusMode(),
                    "page":{
                        "@type": "signin",
                        "name": input.name,
                        "email": input.email,
                        "referer": session.req.headers['referer']
                    }
                }
            });
        },
        getSignUpPage: function  (session,callback) {
            var input = session.input ? session.input : {};

            callback({
                "app":{
                    "mode": io.getTheodorusMode(),
                    "page":{
                        "@type": "signup",
                        "name": input.name,
                        "email": input.email,
                        "referer": session.req.headers['referer']
                    }
                }
            });
        },

        authenticate: function (session,callback) {
            var input = session ? session.input : false,
                throwError = function () {
                    var errorMessage = "bad-credentials";
                    callback(session.isJSON ?
                    {error: {"error":errorMessage}} : {
                        "app":{
                            "mode": io.getTheodorusMode(),
                            "message": { "@type":"error",
                                "@message":errorMessage
                            },
                            "page":{
                                "@type": "signin",
                                "email": input.email,
                                "referer": input.referer ? input.referer : session.req.headers['referer']
                            }
                        }
                    });
                };
            if (!input || (typeof input === "undefined")) {
                throwError();
            } else {
                var email = input.email;
                var password = input.password;
                if (!email || email.length==0 || !password) {
                    throwError();
                } else {
                    if ("true"!=(input.md5+"")) {
                        if (password.length==0) {
                            throwError();
                        } else {
                            password= io.crypto.createHash('md5').update(password).digest('hex');
                        }
                    }

                    io.db.getCredentials(email,function (credentials) {
                        if (!credentials) { // email not listed
                            throwError();
                        } else  {
                            if (credentials.get("password") != password) {
                                throwError();
                            } else {
                                //TODO: write last login date
                                var userId = credentials.get("user_id");
                                session.cookie(userId, input["remember"]);
                                io.db.getAccount(userId,function (user) {
                                    if (session.isJSON) {
                                        callback((user ? user : new User()).toJSON());
                                    } else {
                                        session.res.writeHead(301,{location: input.referer });
                                        callback({});
                                    }
                                });
                            }
                        }
                    });
                }
            }
        },

        createCredentials: function (session,callback) {
            var input = session.input,
                email = input.email,
                name = input.name,
                password = input.password,
                passwordRepeat = input.password_repeat,
                error = false,
                throwError = function (errorMessage) {
                    callback(session.isJSON ?
                        {error: errorMessage} : {
                        "app":{
                            "mode": io.getTheodorusMode(),
                            "message": { "@type":"error",
                                         "@message":errorMessage
                            },
                            "signup":{
                                "name": input.name,
                                "email": input.email
                            }
                        }
                    });
                };

            if ("true"!=input.md5) {
                if (password.length<=io.config.minimum_password_length) {
                    throwError ("password-too-short");
                    return;
                } else {
                    password= io.crypto.createHash('md5').update(password).digest('hex');
                    passwordRepeat= io.crypto.createHash('md5').update(passwordRepeat).digest('hex');
                }
            }
            if (!this.emailPattern.test(email)) {
                throwError ("email-is-invalid");
            } else if (password != passwordRepeat) {
                throwError ("passwords-dont-match");
            } else if (name.length<=io.config.minimum_display_name_length) {
                throwError ("name-too-short");
            } else if (input["terms_of_use"]!="true" && input["terms_of_use"]!="on") {
                throwError ("terms-of-use-not-approved");
            } else  {
                io.db.getUserByName(name,function (result) {
                    if (result) {
                        throwError("name-in-use");
                    } else  {
                        io.db.getCredentials(email,function (result) {
                            if (result) {
                                throwError("email-in-use");
                            } else  {
                                var user = new User ({"email":email,"display_name":name, "permissions":{"suggest":true}});
                                io.db.save(user,
                                    function (user) {
                                        if (!user) {
                                            console.error("io.db.save(User)=>user-not-saved");
                                            throwError("operation-failed");
                                            return;
                                        }
                                        try {
                                            var userId =  user.get("user_id");
                                            var credentials = new Credentials({"auth_key":email,"password":password,"user_id":userId});
                                            io.db.save(credentials, function () {
                                                try {
                                                    session.cookie(userId, false);
                                                    if (session.isJSON) {
                                                        callback({"result":user.toJSON()});
                                                    } else {
                                                        session.res.writeHead(301,{location: input.referer });
                                                        callback({});
                                                    }
                                                } catch (err) {
                                                    console.error("io.db.save(Credentials).callback=>"+ err);
                                                    throwError("operation-failed");
                                                }
                                            });
                                        } catch (err) {
                                            console.error("io.db.save(User).callback=>"+ err);
                                            throwError("operation-failed");
                                        }

                                    }
                                );

                            }
                        }); // io.db.getCredentials
                    }
                }); // io.db.getUserByName
            }
        },

        getSignOutPage: function  (session,callback) {
            console.log("sign out");
            session.cookie("", false);
            session.res.writeHead(301,{location: '/'});
            callback({});
        },

        signOut: function  (session,callback) {
            session.cookie("", false);
            callback({}); // no errors
        }
    };
}());

if (typeof exports !== "undefined") {
    exports.init = AccountProcess.init.bind(AccountProcess);
}