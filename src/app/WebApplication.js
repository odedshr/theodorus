/** @module theodorus.WebApplication */
(function () {
    var _ = require("underscore"),
        express = require('express'),
        fileSystem = require("fs"),
        YEAR = 31536000000,
        rootFolder = false,

    /** @class theodorus.WebApplication */
    WebApplication = function (config, folder) {
        rootFolder = folder.substr(0,folder.lastIndexOf("/"))+ "/www";

        var self = this;
        self.config = config;
        self.vars = function vars(varName, isRequired) {
            var variable = process.env[varName];
            if (typeof variable === "undefined") {
                variable = config[varName];
                if (typeof variable === "undefined" && isRequired) {
                    throw Error("The required variable "+varName + " was not found. Please fix problem and try again");
                }
            }
            return variable;
        };
        self.getApplicationMode = function getApplicationMode () {
            return self.vars(self.appName+"_MODE");
        };
        self.mail = require(folder+"/utils/Mailer").init(this).mail;
        self.log = function log (content, type) {
            var date = new Date(),
                target;
            switch (type) {
                case "exception" :
                    target = console.error;
                    content = (content.message ? ("\nMessage: " + content.message) : "") + (content.stack ? ("\nStacktrace:\n====================\n"+content.stack): "");
                    break;
                case "error" : target = console.error; break;
                case "warn" : target = console.warn; break;
                default : target = console.log; break;
            }
            target (date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() +" | " + ((typeof content === "object") ? JSON.stringify(content) : content));
            if (self.mailLogs && self.getApplicationMode()!="dev" && type == "error") {
                self.mail({
                    emailTemplate: "logged-action",
                    emailData: {    server: self.ipaddress,
                        type:  type,
                        content: content
                    }
                },function () {});
            }
        };


        self.qs = require("querystring");
        self.formidable = require("formidable");
        self.uiVersion = (self.getApplicationMode()!="dev") ? (new Date()).toISOString() : false;
        self.xslt = require(folder+"/utils/XSLTRenderer").init(rootFolder + "/themes/"+config.theme,self.uiVersion);
        self.db = require (folder+'/db/DbApi').init(self.vars, self.log);
        self.appName = config.application_name;
        self.portListener = false; // will get results from app.listen() and used to shut down the server
        {
            var encryption = require(folder+"/utils/Encryption");
            encryption.init(self.vars);
            self.encrypt = encryption.encrypt.bind(encryption);
            self.rsaEncrypt = encryption.rsaEncrypt.bind(encryption);
            self.rsaDecrypt = encryption.rsaDecrypt.bind(encryption);
        }

        function AppAPI(req,res) {
            this.req = req;
            this.res = res;
            this.url = req.url;
            this.server = req.protocol + '://' + req.get('host');
            this.isJSON = (req.get("accept").indexOf("json")!=-1);
            this.referer = req.headers.referer;

            this.cookie = function (userId, remember) {
                if (arguments.length>0) {
                    var cookieString = JSON.stringify({
                        "ip": req.socket.remoteAddress,
                        "userId": userId,
                        "remember": remember
                    });
                    this.res.cookie( config.cookie_token, self.rsaEncrypt(cookieString),
                        { maxAge: remember ? YEAR : 900000, httpOnly: false}); // remember ? year : 15m
                    return true;
                } else {
                    var cookies = {};
                    if (this.req.headers && this.req.headers.cookie) {
                        this.req.headers.cookie.split(';').forEach(function(cookie) {
                            var parts = cookie.match(/(.*?)=(.*)$/);
                            cookies[ parts[1].trim() ] = (parts[2] || '').trim();
                        });
                    }
                    return cookies[config.cookie_token];
                }
            };

            this.useInput = function (callback) {
                var This  = this;
                (new self.formidable.IncomingForm()).parse(req, function(error, fields, files) {
                    if (error) {
                        self.log (error,"error");
                    }
                    if (!fields) {
                        fields = {};
                    }
                    for (var key in fields) {
                        fields[key] = _.escape(fields[key]);
                    }
                    This.input = fields;
                    This.input.files = files ? files : {};
                    callback(fields);
                });
            };

            this.useUserId =  function (callback) {
                var token = this.cookie(),
                    userId= false;
                token =  token ? self.qs.unescape(token) : false;
                if (token) {
                    try {
                        token = JSON.parse(self.rsaDecrypt(token));
                        if (token.ip==this.req.socket.remoteAddress) {
                            this.cookie(token.userId,token.remember); // re-set the cookie
                            userId = token.userId;
                        }
                    }
                    catch (error){
                        //something else was written in the cookie. ignore;
                    }
                }
                callback(userId);
            };

            this.useUserAccount = function useUserAccount (callback) {
                this.useUserId(function(userId) {
                    if (userId) {
                        self.db.getAccount(userId, function(user) {
                            callback(user);
                        });
                    } else {
                        callback(false);
                    }
                });
            };

            this.getNotFoundError = function (key,value) {
                res.status(404);
                return this.getErrorHandler('item-not-found',key,value);
            };

            this.getInternalServerError = function () {
                res.status(501);
                return this.getErrorHandler('system-error');
            };

            this.getPermissionDeniedError = function (action) {
                res.status(550);
                return this.getErrorHandler('permission-error','permission',action);
            };

            this.getErrorHandler = function (errorMessage,key,data) {
                self.log (errorMessage+(data ? "\n"+data : ""),"error");
                var output;

                if (self.isJSON) {
                    output = {error: errorMessage};
                } else {
                    output = {
                        "app":{
                            "mode": self.getApplicationMode(),
                            "page": {
                                "@type":"message",
                                "message":{
                                    "@type": "error",
                                    "@message": errorMessage
                                },
                                "user": this.user
                            }
                        }
                    };
                    if (this.req.headers.referer==(self.server+self.url)) {
                        output.app.page.referer = this.req.headers.referer;
                    }
                    output.app[key] = data;
                }
                return output;
            };

            this.log = function log (content, type) {
                self.log(content, type);
            };
        }

        /*  ================================================================  */
        /*  Helper functions.                                                 */
        /*  ================================================================  */

        /////////////////////////////////////////////////////////////////////

        self.getAppAPI = function (req, res) {
            return new AppAPI(req,res);
        };

        self.handlers = {
            "get":[],
            "post":[],
            "delete":[],
            "put":[]
        };
        self.pipes = {};

        // getHandler(method,url) function is used for internal invocations
        self.getHandler = function(method,url) {
            var i, handlers = self.handlers[method.toLowerCase()];
            for (i in handlers) {
                var handler = handlers[i];
                if ((typeof handler.pattern == "string") ? (url == handler.pattern):  handler.pattern.test(url)) {
                    return handler.handlerDef;
                }
            }
            self.log("getHandler failed to match url " + url,"error");
            throw new Error ("failed-to-match-url");
        };

        self.executePipes = function (pattern,session,mainFunc,callback) {
            try {
                var pipes = self.pipes[pattern],
                    nextPipe = function(session, nextPipe, callback) {
                        if (pipes.length) {
                            (pipes.pop())(session, nextPipe, callback);
                        } else {
                            mainFunc(session,function(output) {
                                callback(output);
                            });
                        }
                    };

                pipes = (typeof pipes == "undefined") ? [] : pipes.slice(0); // slice(0) clones the array
                nextPipe (session, nextPipe, callback);
            } catch (err) {
                self.log(err,"exception");
                callback(session.getInternalServerError("exception",err));
            }
        };

        self.executeHandler = function executeHandler(res, session, handlerDef, callback) {
            var method = session.req.method.toLocaleLowerCase(),
                handler = handlerDef.handler,
                url = handlerDef.url;
            self.executePipes(method + ":" + (Array.isArray(url) ? url[0] : url), session, handler, callback);
        };

        self.processRequest = function (res, session, handlerDef) {
            self.executeHandler(res, session, handlerDef , function writeOutput (output) {
                if (!session.isJSON && output.directive) {
                    switch (output.directive) {
                        case "redirect":
                            var location = output.location;
                            location = (location!="referer") ? location : session.req.headers.referer;
                            res.writeHead(301,{"location" : location} );
                            res.end();
                            break;
                        case "default": res.end(session.getNotFoundError("directive",output.directive));
                    }
                } else if (!session.isJSON && output.app) {
                    var app = output.app;
                    _.extend(app, {
                        mode : self.getApplicationMode(),
                        server : "http"+(session.req.connection.encrypted?"s":"")+"://" + session.req.headers.host,
                        url : session.url,
                        referer : session.req.headers.referer,
                        noCache : Math.random()
                    });

                    res.end(self.xslt(output));
                } else {
                    res.end(JSON.stringify(output));
                }
            });
        };

        self.addHandler = function addHandler (handlerDef) {
            var urls = Array.isArray(handlerDef.url) ? handlerDef.url : [ handlerDef.url ],
                method = handlerDef.method.toLowerCase();
            urls.forEach(function (url) {
                self.handlers[method].push ({   "pattern":url,
                    "handlerDef":handlerDef }); // store func for internal invocation // handlerDef.url
                self.app[method](url, function (req, res) { // external invocation
                    var session = self.getAppAPI(req, res);
                    res.setHeader('Content-Type', (session.isJSON ? 'application/json' : 'text/html') + "; charset=utf8");
                    if (req.method == "GET" || req.method == "DELETE") {
                        self.processRequest(res, session, handlerDef);
                    } else {
                        session.useInput(function () {
                            self.processRequest(res, session, handlerDef);
                        });
                    }
                }); // external invocation
            });
        };

        self.addPipe = function addPlugin (pipeDef) {
            var urls = Array.isArray(pipeDef.url) ? pipeDef.url : [pipeDef.url] ,
                method = pipeDef.method.toLowerCase();
            urls.forEach(function (url) {
                var pattern = method+":"+url,
                    repo = self.pipes[pattern];
                if (typeof repo == "undefined") {
                    repo = [];
                    self.pipes[pattern] = repo;
                }
                self.pipes[pattern].push (pipeDef.pipe);
            });
        };

        self.initProcesses =  function () {
            var libs = [];
            config.processes.forEach( function (processName) {
                libs.push(folder + "/processes/"+processName);
            });
            config.plugins.forEach( function (pluginName) {
                libs.push("../www/plugins/"+pluginName+"/process");
            });
            libs.forEach( function(libraryFileName) {
                try {
                    var library = require(libraryFileName);
                    var methods = library.init(self);
                    if (Array.isArray(methods)) {
                        methods.forEach(function (method) {
                            if (method.handler) {
                                self.addHandler(method);
                            } else {
                                self.addPipe(method);
                            }
                        });
                    }
                    if (library.methods) { library.methods().forEach(self.addHandler.bind(self)); }
                    if (library.pipes) { library.pipes().forEach(self.addhandler.bind(self)); }
                } catch (error) {
                    self.log("failed to init "+libraryFileName + " ("+error+")","error");
                }
            });
        };

        self.initialize = function () {
            var app = self.app = express(),
                profilesFolder = self.config.profile_images_folders;

            app.use(express.static( rootFolder ));
            // the client doesn't need to know the name of the current theme to work by redirect current-theme calls to it:
            app.get("/ui/version", function (req, res) {
                res.writeHead(200, {'Content-Type': "text/json" });
                res.end(JSON.stringify({"version": self.uiVersion})); //
            });
            app.get(/^[\/]{1,2}ui\/.*$/, function(req, res){
                res.setHeader('Cache-Control', 'public, max-age=' + (YEAR / 1000));
                var requestedFile = req.url.replace(/[\/]{1,2}ui\//,"/themes/"+config.theme+"/").replace(/\?_=\d+$/,"");
                fileSystem.exists(rootFolder + requestedFile, function isFileExists (exists) {
                    if (exists) {
                        res.redirect(requestedFile);
                    } else {
                        console.error("file not found " + rootFolder + requestedFile);
                        res.end (self.getAppAPI(req,res).getNotFoundError("file",requestedFile));
                    }
                });
            });
            // profile-images are stored outside the project
            app.get(/^[\/]{1,2}profileImage\/.+$/, function(req, res){
                res.setHeader('Cache-Control', 'public, max-age=' + (YEAR / 1000));
                //TODO: move this function to accountProcess (problem that process output must be json/text)
                var image = req.url.replace(/[\/]{1,2}profileImage\//,profilesFolder+"/");
                fileSystem.exists(image, function (exists) {
                    if (exists) {
                        try {
                            var readFile = fileSystem.readFileSync(image);
                            res.writeHead(200, {'Content-Type': 'image/'+image.substring(image.lastIndexOf(".")+1) });
                            res.end(readFile, 'binary');
                        } catch (error) {
                            self.log("failed to load profile image "+req.url,"error");
                            res.redirect("/ui/img/anonymous.png");
                        }
                    } else {
                        res.redirect("/ui/img/anonymous.png");
                    }
                });
            });

            self.ipaddress = self.vars("OPENSHIFT_NODEJS_IP") || self.vars("IP") || "127.0.0.1";
            self.port      = self.vars("OPENSHIFT_NODEJS_PORT") || self.vars("PORT") || 8080;
            self.mailLogs = true;
        };

        self.start = function (callback) {
            self.portListener = self.app.listen(self.port, self.ipaddress, function() {
                self.log("Node server running "+self.appName+" on "+self.ipaddress+":"+self.port,"info");
                self.initProcesses();
                self.db.verifyDBIntegrity(function (output) {
                    self.log(JSON.stringify(output));
                });
                if (typeof callback == "function") {
                    callback();
                }
            });
        };

        self.run = function (callback) {
            self.initialize();
            self.start(callback);
        };

        self.stop = function stop() {
            if (self.portListener) {
                self.portListener.close();
            }
            self.log("Node server stopped listening on "+self.ipaddress+":"+self.port,"info");
        };
    };

    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.newWebApplication = function newWebApplication(config, folder) { return new WebApplication(config, folder); };
    }
})();

/*


 function getMethodNotImplementedMessage (req,res) {
 res.setHeader('Content-Type', 'application/json' );
 res.end(JSON.stringify({"error":"not-implemented","method":req.method+"/"+req.url}));
 }
 // comments
 app.get(/^\/~[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
 // search
 app.get(/^\/\?[a-zA-Z0-9_-]{1,140}\/?$/, getMethodNotImplementedMessage);
 // errors
 app.get(/^\/![a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage ); // case "post/error/": // {message, screenshot}


a word on pipes
up until now I had a single function needed to be run
it got a input in session.input and its output was sent to callback

now I need to run an unknown amount functions,
each function may alter the session.input and then call the next function,
when the next function ends, the current function should get the output and update it, and then call the next function
 */