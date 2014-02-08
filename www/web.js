var config = require("../config.json"),
    _ = require("underscore"),
    express = require('express'),
    xslt = require('node_xslt');

var WebApplication = function () {
    var self = this;
    self.config = config;
    self.crypto = require("crypto");
    self.qs = require("querystring");
    self.db = require ('./js/db/DbApi').get(config);
    self.rsa = require("./js/RSA");
    self.utils = require("./js/utilities");
    self.rsa_keys =  {
        "encryption":process.env.THEODORUS_RSA_ENCRYPT,
        "decryption":process.env.THEODORUS_RSA_DECRYPT,
        "modulus":process.env.THEODORUS_RSA_MODULUS
    };

    function Session(req,res) {
        this.req = req;
        this.res = res;
        this.url = req.url;
        this.isJSON = (req.get("accept").indexOf("json")!=-1);

        this.cookie = function (userId, remember) {
            if (arguments.length>0) {
                var cookieString = JSON.stringify({
                    "ip": req.socket.remoteAddress,
                    "userId": userId,
                    "remember": remember
                });
                this.res.cookie( config.cookie_token, self.rsa.generateKey(self.rsa_keys).encrypt(cookieString),
                    { maxAge: remember ? 31536000000 : 900000, httpOnly: false}); // remember ? year : 15m
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
            var body = "";
            var This = this;
            this.req.on('data', function (data) { body +=data; });
            this.req.on('end',function(){
                var data = (0<body.length) ? self.qs.parse(body) : {};
                //TODO: sanitize input
                This.input = data;
                callback(data);
            });
        };

        this.useUserId =  function (callback) {
            var token = this.cookie(),
                userId= false;
            if (token = (token ? self.qs.unescape(token) : false)) {
                try {
                    token = JSON.parse(self.rsa.generateKey(self.rsa_keys).decrypt(token));
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
                        "mode": self.getTheodorusMode(),
                        "page": {
                            "@type":"message",
                            "message":{
                                "@type": "error",
                                "@message": errorMessage
                            },
                            "user": this.user,
                            "referer":this.req.headers['referer']
                        }
                    }
                };
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
        target (date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() +" | " + content);
    };

    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || config.port || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            self.log('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1',"warn");
            self.ipaddress = "127.0.0.1";
        }
    };

    self.getTheodorusMode = function getTheodorusMode () {
        return process.env.THEODORUS_MODE;
    }
/*    self.getScriptList = function () {
        var list =(process.env.THEODORUS_MODE=="dev") ? config.clientScriptsDebug : config.clientScripts;
        return (typeof list != "undefined") ? list : [];
    };

    self.getScriptListXML = function () {
        var list = self.getScriptList(),
            xml = "";
        list.forEach(function(script) {
            xml+= "<script src='"+script+"' />";
        });
        return xml;
    };*/

    self.plugins = function (url,session,mainFunc,callback) {
        mainFunc(session,function(output) {
            callback(output);
        });
    };

    self.xslt = function (content) {
        var xsltDocument = xslt.readXsltFile(__dirname + "/themes/"+config.theme+"/xslt/default.xsl"),
            xmlDocument = xslt.readXmlString("<xml>"+((typeof content === "object") ? self.utils.json2xml (content) : content)+"</xml>");
        return xslt.transform( xsltDocument,xmlDocument, [])
    };

    /////////////////////////////////////////////////////////////////////

    self.getSession = function (req, res) {
        return new Session(req,res);
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
            functionWrapper = (method=="get" || method=="delete") ?
            function (req,res) {
                var session = self.getSession(req,res);
                //self.log (method+":"+url);
                res.setHeader('Content-Type', session.isJSON ? 'application/json' : 'text/html');
                self.plugins(url, session, handlerDef.handler,function(output) {
                    res.end(session.isJSON ? JSON.stringify(output) : self.xslt(output));
                });
            } :
            function (req,res) {
                var session = self.getSession(req,res);
                //self.log (method+":"+url);
                res.setHeader('Content-Type', session.isJSON ? 'application/json' : 'text/html');
                session.useInput(function() {
                    self.plugins(url, session, handlerDef.handler,function(output) {
                        res.end(session.isJSON ? JSON.stringify(output) : self.xslt(output));
                    });
                });
            };

        self.handlers[method].push ({   "pattern":url,
                                        "method":handlerDef.handler}); // store func for internal invocation // handlerDef.url
        self.app[method](url, functionWrapper); // external invocation
    };

    self.initProcesses =  function () {
        config.processes.forEach( function(libraryName) {
            require("./js/"+libraryName).init(self).forEach(self.addHandler.bind(self));
        });
    };

    self.initialize = function () {
        var app = self.app = express();
        app.use(express.cookieParser());
        app.use(express.static(__dirname ));
        // the client doesn't need to know the name of the current theme to work by redirect current-theme calls to it:
        app.get(/^[\/]{1,2}ui\/.*$/, function(req, res){ res.redirect(req.url.replace(/[\/]{1,2}ui\//,"/themes/"+config.theme+"/"));
        });
        self.addHandler({"method":"GET", "url":"/web.js", "handler":function(session,callback) {
            callback({"error":"no-permission-to-access-file"});
        }});
        self.setupVariables();
        self.initProcesses();
    };

    self.start = function () {
        self.app.listen(self.port, self.ipaddress, function() {
            self.log("Node server started on "+self.ipaddress+":"+self.port,"info");
        });
    };

};

try {
    var instance = new WebApplication();
    instance.initialize();
    instance.start();
} catch (error) {
    console.error((new Date()) + " | Failed to initialize app\n"+error);
}



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