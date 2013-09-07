var io = null,
    User = (typeof User !== "undefined") ? User : require("../models/User").model(),
    Credentials = (typeof Credentials !== "undefined") ? Credentials : require("../models/Credentials").model();

var AccountProcess = (function () {
    return {
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
            callback ("<app>"+Theodorus.getScriptListXML()+"<signin /></app>");
        },
        getSignUpPage: function  (session,callback) {
            var input = session.input;
            callback("<app>"+Theodorus.getScriptListXML()+"<signup>" +
                "<email>"+input.email+"</email>" +
                "<password>"+(input.md5 ? "" : input.password)+"</password>" +
                "<password_repeat>"+(input.md5 ? "" : input.password_repeat)+"</password_repeat>" +
                "</signup></app>");
        },

        authenticate: function (session,callback) {
            var input = session.input;
            var failed = function () {
                callback({"error":"bad-credentials"});
            };
            var email = input.email;
            var password = input.password;
            if ("true"!=input.md5) {
                if (password.length==0) {
                    failed();
                } else {
                    password= io.crypto.createHash('md5').update(password).digest('hex');
                }
            }
            if (email.length==0) {
                failed();
            }
            io.db.getCredentials(email,function (credentials) {
                if (!credentials) { // email not listed
                    failed();
                } else  {
                    if (credentials.get("password") != password) {
                        failed();
                    } else {
                        //TODO: write last login date
                        var userId = credentials.get("user_id");
                        session.cookie(userId, input["remember"]);
                        io.db.getAccount(userId,function (user) {
                            callback((user ? user : new User()).toJSON());
                        });
                    }
                }
            });
        },

        createCredentials: function (session,callback) {
            var input = session.input;

            var email = input.email;
            var name = input.name;
            var password = input.password;
            var passwordRepeat = input.password_repeat;
            if ("true"!=input.md5) {
                if (password.length<=io.config.minimum_password_length) {
                    callback({"error":"password-too-short"});
                    return
                }
                password= io.crypto.createHash('md5').update(password).digest('hex');
                passwordRepeat= io.crypto.createHash('md5').update(passwordRepeat).digest('hex');
            }
            var emailPattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!emailPattern.test(email)) {
                callback({"error":"email-is-invalid"});
            } else if (password != passwordRepeat) {
                callback({"error":"passwords-dont-match"});
            } else if (name.length<=io.config.minimum_display_name_length) {
                callback({"error":"name-too-short"});
            } else if (input["terms_of_use"]!="true") {
                callback({"error":"terms-of-use-not-approved"});
            } else {
                io.db.getUserByName(name,function (result) {
                    if (result) {
                        callback({"error":"name-in-use"});
                    } else  {
                        io.db.getCredentials(email,function (result) {
                            if (result) {
                                callback({"error":"email-in-use"});
                            } else  {
                                var user = new User ({"email":email,"display_name":name, "permissions":{"suggest":true},"status":"participant"});
                                io.db.save(user,
                                    function (user) {
                                        if (!user) {
                                            console.error("io.db.save(User)=>user-not-saved");
                                            callback({"error":"operation-failed"});
                                        }
                                        try {
                                            var userId =  user.get("user_id");
                                            var credentials = new Credentials({"auth_key":email,"password":password,"user_id":userId});
                                            io.db.save(credentials, function () {
                                                try {
                                                    session.cookie(userId, false);
                                                    callback({"result":user.toJSON()});
                                                } catch (err) {
                                                    console.error("io.db.save(Credentials).callback=>"+ err);
                                                }
                                            });
                                        } catch (err) {
                                            console.error("io.db.save(User).callback=>"+ err);
                                            callback({"error":"operation-failed"});
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
            session.cookie("", false);
            callback("<app>"+Theodorus.getScriptListXML()+"<signout /></app>");
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