var io = null,
    MIN_PASSWORD_LENGTH = 3,
    MIN_NAME_LENGTH = 4,
    User = require("../../models/User").model(),
    Credentials = require("../../models/Credentials").model(),
    crypto = require("crypto");

exports.init = function (ioFunctions) {
    io = ioFunctions;
    var methods = []; //I'm using push because of an annoying compiler warning
    methods.push({"method":"GET","url":"/signin","handler":getSignInPage});
    methods.push({"method":"POST","url":"/signin","handler":authenticate});
    methods.push({"method":"POST","url":"/user/exists","handler":isNameExists});
    methods.push({"method":"GET","url":"/signup","handler":getSignUpPage});
    methods.push({"method":"POST","url":"/signup","handler":createCredentials});
    methods.push({"method":"GET","url":"/signout","handler":getSignOutPage});

    methods.push({"method":"GET","url":"/me","handler":getAccount});
    methods.push({"method":"DELETE","url":"/me","handler":signOut});
    return methods;
}

function getAccount(req,res) {
    io.jsonHeaders(res);
    io.getCurrentUserId(req,res, function (userId) {
        if (userId) {
            io.db.getAccount(userId,function (user) {
                io.jsonAppend((user ? user : new User()).toJSON(),res);
            });
        } else {
            var user = new User.Account();
            io.jsonAppend(user.toJSON(),res);
        }
    });
}

function isNameExists(req,res) {
    io.jsonHeaders(res);
    io.useInput(req, function (data) {
        io.db.getUserByName(data.display_name, function (result) {
            io.jsonAppend((result ? {"result":"name-is-available"} : {"error":"name-in-use"}),res);
        });
    });
}

function getSignInPage (req,res) { io.xslt("<app mode='"+io.config.mode+"'><signin /></app>",res); }
function getSignUpPage (req,res) {
    //TODO: template should contain POST data
    io.useInput(req,function(data){
        io.xslt("<app mode='"+io.config.mode+"'><signup>" +
            "<email>"+data.email+"</email>" +
            "<password>"+(data.md5 ? "" : data.password)+"</password>" +
            "<password_repeat>"+(data.md5 ? "" : data.password_repeat)+"</password_repeat>" +
            "</signup></app>",res);
    });
}

function authenticate(req,res) {
    var failed = function () { io.json({"error":"bad-credentials"},res); return false; };
    io.jsonHeaders(res);
    io.useInput(req,function(data){
        var email = data.email;
        var password = data.password;
        if ("true"!=data.md5) {
            if (password.length==0) {
                return failed();
            }
            password= crypto.createHash('md5').update(password).digest('hex');
        }
        if (email.length==0) {
            return failed();
        }
        io.db.getCredentials(email,function (credentials) {
            if (!credentials) { // email not listed
                return failed();
            } else  {
                if (credentials.get("password") != password) {
                    return failed();
                } else {
                    //TODO: write last login date
                    var userId = credentials.get("user_id");
                    io.setAuthenticationCookie(req,res, userId, data["remember"]);
                    io.db.getAccount(userId,function (user) {
                        io.jsonAppend((user ? user : new User()).toJSON(),res);
                    });
                }
            }
        });
    });
}

function createCredentials(req,res) {
    io.jsonHeaders(res);
    io.useInput(req,function(data){
        var email = data.email;
        var name = data.name;
        var password = data.password;
        var passwordRepeat = data.password_repeat;
        if ("true"!=data.md5) {
            if (password.length<=MIN_PASSWORD_LENGTH) {
                io.json({"error":"password-too-short"},res);
                return
            }
            password= crypto.createHash('md5').update(password).digest('hex');
            passwordRepeat= crypto.createHash('md5').update(passwordRepeat).digest('hex');
        }
        var emailPattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailPattern.test(email)) {
            io.json({"error":"email-is-invalid"},res);
        } else if (password != passwordRepeat) {
            io.json({"error":"passwords-dont-match"},res);
        } else if (name.length<=MIN_NAME_LENGTH) {
            io.json({"error":"name-too-short"},res);
        } else if (data["terms_of_use"]!="true") {
            io.json({"error":"terms-of-use-not-approved"},res);
        } else {
            io.db.getUserByName(name,function (result) {
                if (result) {
                    io.json({"error":"name-in-use"},res);
                } else  {
                    io.db.getCredentials(email,function (result) {
                        if (result) {
                            io.json({"error":"email-in-use"},res);
                        } else  {
                            var user = new User ({"email":email,"display_name":name, "permissions":{"suggest":true},"status":"participant"});
                            io.db.save(user,
                                function (user) {
                                    try {
                                        if (!user) {
                                            throw new Error("user not saved");
                                        }
                                        var userId =  user.get("user_id");
                                        var credentials = new Credentials({"auth_key":email,"password":password,"user_id":userId});
                                        io.db.save(credentials, function () {
                                            try {
                                                io.setAuthenticationCookie(req,res, userId, false);
                                                io.jsonAppend({"result":user.toJSON()},res);
                                            } catch (err) {
                                                console.error("io.db.save(Credentials).callback=>"+ err);
                                            }
                                        });
                                    } catch (err) {
                                        console.error("io.db.save(User).callback=>"+ err);
                                        io.jsonAppend({"error":"operation-failed"},res);
                                    }

                                }
                            );

                        }
                    }); // io.db.getCredentials
                }
            }); // io.db.getUserByName
        }
    });
}

function getSignOutPage (req,res) {
    io.setAuthenticationCookie(req,res, "", false);
    io.xslt("<app><signout /></app>",res)
}

function signOut (req,res) {
    io.setAuthenticationCookie(req,res, "", false);
    io.jsonAppend({},res); // no errors
}