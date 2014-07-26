(function () {
    var _ = require("underscore"),
        express = require('express'),
        xslt = require('node_xslt'),
        fileSystem = require("fs"),
        YEAR = 31536000000,
        rootFolder = __dirname.substr(0,__dirname.lastIndexOf("/")),

    WebApplication = function (config) {
        var self = this;
        self.envVar = function envVar(varName) { return process.env[varName]; };
        self.config = config;
        self.qs = require("querystring");
        self.formidable = require("formidable");
        self.crypto = require("crypto");
        self.db = require (__dirname+'/db/DbApi').get(config);
        self.rsa = require(__dirname+"/RSA");
        self.utils = require(__dirname+"/utilities");
        self.mailer = require(__dirname+"/processes/MailProcess");
        self.appName = config.application_name;
        self.encrypt = function encrypt (string) {
            return self.crypto.createHash('md5').update(string).digest('hex');
        }
        self.rsaKeys =  {
            "encryption":self.envVar(self.appName+"_RSA_ENCRYPT"),
            "decryption":self.envVar(self.appName+"_RSA_DECRYPT"),
            "modulus":self.envVar(self.appName+"_RSA_MODULUS")
        };
        self.uiVersion = false;
        self.portListener = false; // will get results from app.listen() and used to shut down the server

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
                    this.res.cookie( config.cookie_token, self.rsa.generateKey(self.rsaKeys).encrypt(cookieString),
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
                        token = JSON.parse(self.rsa.generateKey(self.rsaKeys).decrypt(token));
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

        self.log = function log (content, type) {
            var date = new Date(),
                target;
            switch (type) {
                case "error" : target = console.error; break;
                case "warn" : target = console.warn; break;
                default : target = console.log; break;
            }
            target (date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() +" | " + ((typeof content === "object") ? JSON.stringify(content) : content));
            if (self.mailLogs && self.getApplicationMode()!="dev" && type == "error") {
                (self.getHandler("put","/mail"))({    input: {
                    emailTemplate: "logged-action",
                    emailData: {    server: self.ipaddress,
                        type:  type,
                        content: content
                    }
                }}, function (){});
            }
        };

        self.setupVariables = function() {
            //  Set the environment variables we need.
            self.ipaddress = self.envVar("OPENSHIFT_NODEJS_IP");
            self.port      = self.envVar("OPENSHIFT_NODEJS_PORT") || config.port || 8080;

            if (self.getApplicationMode()!="dev") {
                self.uiVersion = (new Date()).toISOString();
            }

            if (typeof self.ipaddress === "undefined") {
                //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
                //  allows us to run/test the app locally.
                self.log('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1',"warn");
                self.ipaddress = "127.0.0.1";
            }
        };

        self.getApplicationMode = function getApplicationMode () {
            return self.envVar(self.appName+"_MODE");
        }

        self.plugins = function (url,session,mainFunc,callback) {
            mainFunc(session,function(output) {
                callback(output);
            });
        };

        self.xslt = function (content) {
            try {
                if ((typeof content === "object")) {
                    if (content.app) {
                        content.app["@version"] = self.uiVersion;
                    }
                    content = self.utils.json2xml (content);
                }
                var xsltDocument = xslt.readXsltFile(rootFolder + "/themes/"+config.theme+"/xslt/default.xsl"),
                    xmlDocument = xslt.readXmlString("<xml>"+content+"</xml>");
                return xslt.transform( xsltDocument,xmlDocument, []);
            } catch (error) {
                console.error("failed to xslt "+ ((typeof content === "object") ? self.utils.json2xml (content) : content) +"\n" + error);
                return "";
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

        self.addHandler = function (handlerDef) {
            /* self.NoInputHandler and self.WithInputHandler are practically the same except for the input question, which I
             * prefer will happen only on init and not every time the function runs ...
             * Also, notice that the functionWrapper uses handlerDef.handler, so I cannot extract it from within the
             * addHandler function ...
             * */
            //TODO: remove addHandler's functionWrapper code duplication
            var url = handlerDef.url,
                method = handlerDef.method.toLowerCase(),
                pluginWrapper = function pluginWrapper (res, session, handler) {
                    self.plugins(url, session, handler,function(output) {
                        res.end((session.isJSON || !output.app) ? JSON.stringify(output) : self.xslt(output));
                    });
                },
                functionWrapper = (method=="get" || method=="delete") ?
                    function (req,res) {
                        var session = self.getAppAPI(req,res);
                        res.setHeader('Content-Type', (session.isJSON ? 'application/json' : 'text/html')+ "; charset=utf8");
                        pluginWrapper (res, session, handlerDef.handler);
                    } :
                    function (req,res) {
                        var session = self.getAppAPI(req,res);
                        res.setHeader('Content-Type', (session.isJSON ? 'application/json' : 'text/html') + "; charset=utf8");
                        session.useInput(function() {
                            pluginWrapper (res, session, handlerDef.handler);
                        });
                    };

            self.handlers[method].push ({   "pattern":url,
                "method":handlerDef.handler}); // store func for internal invocation // handlerDef.url
            self.app[method](url, functionWrapper); // external invocation
        };

        self.initProcesses =  function () {
            config.processes.forEach( function(libraryName) {
                try {
                    require("./"+libraryName).init(self).forEach(self.addHandler.bind(self));
                } catch (error) {
                    self.log("failed to init "+libraryName + " ("+error+")","error");
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

            self.addHandler({"method":"GET", "url":"/web.js", "handler":function(session,callback) {
                callback({"error":"no-permission-to-access-file"});
            }});

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
            self.log("Node server stopped listening on "+self.ipaddress+":"+self.port,"info")
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


 */