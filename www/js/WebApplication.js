(function () {
    //xslt = require('node_xslt'),
    var _ = require("underscore"),
        express = require('express'),
        fileSystem = require("fs"),
        YEAR = 31536000000,
        rootFolder = __dirname.substr(0,__dirname.lastIndexOf("/")),

    WebApplication = function (config) {
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
            return variable
        };
        self.getApplicationMode = function getApplicationMode () { return self.vars(self.appName+"_MODE"); }
        self.mail = require(__dirname+"/processes/MailProcess").init(this).mail;
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
        self.xslt = require(__dirname+"/utils/XSLTRenderer").init(rootFolder + "/themes/"+config.theme,self.uiVersion);
        self.db = require (__dirname+'/db/DbApi').init(self.vars, self.log);
        self.appName = config.application_name;
        self.portListener = false; // will get results from app.listen() and used to shut down the server
        {
            var encryption = require(__dirname+"/utils/Encryption");
            encryption.init(self.vars);
            self.encrypt = encryption.encrypt.bind(encryption);
            self.rsaEncrypt = encryption.rsaEncrypt.bind(encryption);
            self.rsaDecrypt = encryption.rsaDecrypt.bind(encryption);
        }

        function AppAPI(req,res) {
            this.req = req;
            this.res = res;
            this.url = req.url;
            this.server = req.protocol + '://' + req.get('host')
            this.isJSON = (req.get("accept").indexOf("json")!=-1);
            this.referer = req.headers['referer'];

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
                if (token = (token ? self.qs.unescape(token) : false)) {
                    try {
                        token = JSON.parse(self.rsaDecrypt(token));
                        if (token.ip==this.req.socket.remoteAddress) {
                            this.cookie(token.userId,token.remember); // re-set the cookie
                            userId = token.userId
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
                        })
                    } else {
                        callback(false);
                    }
                });
            };

            this.get404 = function () {
                res.status(404);
                return this.getErrorHandler('item-not-found');
            };

            this.get501 = function () {
                res.status(501);
                return this.getErrorHandler('system-error');
            };

            this.getErrorHandler = function (errorMessage,key,data) {
                self.log (errorMessage+"\n"+data,"error");
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
                    if (this.req.headers['referer']==(self.server+self.url)) {
                        output.app.page.referer = this.req.headers['referer'];
                    }
                    output.app[key] = data;
                }
                return output;
            };

            this.log = function log (content, type) {
                self.log(content, type);
            }
        }

        /*  ================================================================  */
        /*  Helper functions.                                                 */
        /*  ================================================================  */

        self.setupVariables = function() {
            //  Set the environment variables we need.
            self.ipaddress = self.vars("OPENSHIFT_NODEJS_IP");
            self.port      = self.vars("OPENSHIFT_NODEJS_PORT") || config.port || 8080;

            if (typeof self.ipaddress === "undefined") {
                //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
                //  allows us to run/test the app locally.
                self.log('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1',"warn");
                self.ipaddress = "127.0.0.1";
            }
        };

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
        self.plugins = {};

        // getHandler(method,url) function is used for internal invocations
        self.getHandler = function(method,url) {
            var i, handler, handlers = self.handlers[method];
            for (i in handlers) {
                handler = handlers[i];
                if ((typeof handler.pattern == "string") ? (url == handler.pattern):  handler.pattern.test(url)) {
                    return handler.method;
                }
            }
            console.error ("getHandler failed to match url " + url);
            return function(){}; // if no method found, return a zombie function
        };

        self.executePlugins = function (pattern,session,mainFunc,callback) {
            try {
                var plugins = self.plugins[pattern],
                    nextHandler = function(session, nextHandler, callback) {
                        if (plugins.length) {
                            (plugins.pop())(session, nextHandler, callback);
                        } else {
                            mainFunc(session,function(output) {
                                callback(output);
                            });
                        }
                    }
                plugins = (typeof plugins == "undefined") ? [] : plugins.slice(0), // slice(0) clones the array
                    nextHandler (session, nextHandler, callback);
            } catch (err) {
                self.log(err,"exception");
                callback(session.get501());
            }
        };

        self.executeHandler = function executeHandler(res, session, handlerDef) {
            var method = session.req.method.toLocaleLowerCase(),
                handler = handlerDef.handler;
            self.executePlugins(method + ":" + handlerDef.url, session, handler, function (output) {
                if (session.isJSON) {
                    res.end(JSON.stringify(output));
                } else {
                    if (output.directive) {
                        switch (output.directive) {
                            case "redirect":
                                var location = output.location;
                                location = (location!="referer") ? location : session.req.headers['referer'];
                                res.writeHead(301,{"location" : location} );
                                res.end();
                                break;
                            case "default": res.end(session.get404());
                        }
                    } else {
                        var app = output.app;
                        app.mode = self.getApplicationMode();
                        app.server = "http"+(session.req.connection.encrypted?"s":"")+"://" + session.req.headers.host;
                        app.referer = session.req.headers.referer;
                        res.end(self.xslt(output));
                    }
                }
            });
        };

        self.addHandler = function addHandler (handlerDef) {
            var url = handlerDef.url,
                method = handlerDef.method.toLowerCase();

            self.handlers[method].push ({   "pattern":url,
                                            "method":handlerDef.handler}); // store func for internal invocation // handlerDef.url
            self.app[method](url, function (req, res) { // external invocation
                var session = self.getAppAPI(req, res);
                res.setHeader('Content-Type', (session.isJSON ? 'application/json' : 'text/html') + "; charset=utf8");
                res.setHeader('Content-Type', (session.isJSON ? 'application/json' : 'text/html') + "; charset=utf8");
                if (req.method == "GET" || req.method == "DELETE") {
                    self.executeHandler(res, session, handlerDef);
                } else {
                    session.useInput(function () {
                        self.executeHandler(res, session, handlerDef);
                    });
                }
            }); // external invocation
        };

        self.addPlugin = function addPlugin (handlerDef) {
            var pattern = handlerDef.method.toLowerCase()+":"+handlerDef.url,
                repo = self.plugins[pattern];
            if (typeof repo == "undefined") {
                repo = [];
                self.plugins[pattern] = repo;
            }
            self.plugins[pattern].push (handlerDef.handler);
        };

        self.initProcesses =  function () {
            var libs = [];
            config.processes.forEach( function (processName) {
                libs.push("./processes/"+processName);
            });
            config.plugins.forEach( function (pluginName) {
                libs.push("../plugins/"+pluginName+"/process");
            });
            libs.forEach( function(libraryFileName) {
                try {
                    var library = require(libraryFileName);
                    library.init(self);
                    library.methods().forEach(self.addHandler.bind(self));
                    library.plugins().forEach(self.addPlugin.bind(self));
                } catch (error) {
                    self.log("failed to init "+libraryFileName + " ("+error+")","error");
                }
            });
        };

        self.initialize = function () {
            var app = self.app = express(),
                profilesFolder = self.config.profile_images_folders;

            //app.use(require('cookie-parser'));
            //app.use(express.bodyParser({ keepExtensions: true }));
            app.use(express.static( rootFolder ));
            // the client doesn't need to know the name of the current theme to work by redirect current-theme calls to it:
            app.get("/ui/version", function (req, res) {
                res.writeHead(200, {'Content-Type': "text/json" });
                res.end(JSON.stringify({"version": self.uiVersion})); //
            });
            app.get(/^[\/]{1,2}ui\/.*$/, function(req, res){
                res.setHeader('Cache-Control', 'public, max-age=' + (YEAR / 1000));
                var requestedFile = req.url.replace(/[\/]{1,2}ui\//,"www/themes/"+config.theme+"/").replace(/\?_=\d+$/,"");
                if (requestedFile.lastIndexOf(".css") == (requestedFile.length-4)) {
                    res.writeHead(200, {'Content-Type': "text/css" });
                    res.end(fileSystem.readFileSync(requestedFile), 'text');
                } else {
                    res.end(fileSystem.readFileSync(requestedFile), 'binary');
                }
            });
            // profile-images are stored outside the project
            app.get(/^[\/]{1,2}profileImage\/.*$/, function(req, res){
                res.setHeader('Cache-Control', 'public, max-age=' + (YEAR / 1000));
                //TODO: move this function to accountProcess (problem that process output must be json/text)
                var image = req.url.replace(/[\/]{1,2}profileImage\//,profilesFolder+"/");
                fileSystem.exists(image, function (exists) {
                    if (exists) {
                        res.writeHead(200, {'Content-Type': 'image/'+image.substring(image.lastIndexOf(".")+1) });
                        res.end(fileSystem.readFileSync(image), 'binary');
                    } else {
                        res.redirect("ui/img/anonymous.png");
                    }
                });
            });

            self.setupVariables();
            self.initProcesses();

            self.mailLogs = true;
        };

        self.start = function (callback) {
            self.portListener = self.app.listen(self.port, self.ipaddress, function() {
                self.log("Node server running "+self.appName+" on "+self.ipaddress+":"+self.port,"info");
                if (typeof callback == "function") {
                    callback();
                }
            });
        };

        self.run = function (callback) {
            self.initialize();
            self.start(callback);
        }

        self.stop = function stop() {
            self.portListener && self.portListener.close();
            self.log("Node server stopped listening on "+self.ipaddress+":"+self.port,"info");
        }
    };

    if (typeof exports !== "undefined") {
        exports.newWebApplication = function newWebApplication(config) { return new WebApplication(config); };
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


a word on plugins
up until now I had a single function needed to be run
it got a input in session.input and its output was sent to callback

now I need to run an unknown amount functions,
each function may alter the session.input and then call the next function,
when the next function ends, the current function should get the output and update it, and then call the next function
 */