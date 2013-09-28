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
            return this.isJSON ? { "error": 'item-not-found' } : "<app >"+self.getScriptListXML()+"<fileNotFound /></app>";
        }
    }

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || config.port || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
    };

    self.getScriptList = function () {
        return (process.env.THEODORUS_MODE=="dev") ? config.clientScripts : config.clientScriptsDebug;
    };

    self.getScriptListXML = function () {
        var list = self.getScriptList();
        var xml = "";
        list.forEach(function(script) {
            xml+= "<script src='"+script+"' />";
        });
        return xml;
    };

    self.plugins = function (url,session,mainFunc,callback) {
        mainFunc(session,function(output) {
            callback(output);
        });
    };

    self.xslt = function (xmlString) {
        if (typeof xmlString === "object") {
            return "<pre>"+JSON.stringify(xmlString)+"</pre>";
        }
        var xsltDocument = xslt.readXsltFile(__dirname + "/themes/"+config.theme+"/xslt/default.xsl");
        var xmlDocument = xslt.readXmlString("<xml>"+xmlString+"</xml>");
        return xslt.transform( xsltDocument,xmlDocument, [])
    };

    self.getSession = function (req, res) {
        return new Session(req,res);
    };

    self.addHandler = function (handlerDef) {
        var functionWrapper = (handlerDef.method=="GET" || handlerDef.method=="DELETE") ?
            function (req,res) {
                var session = self.getSession(req,res);
                res.setHeader('Content-Type', session.isJSON ? 'application/json' : 'text/html');
                self.plugins(handlerDef.url, session, handlerDef.handler,function(output) {
                    res.end(session.isJSON ? JSON.stringify(output) : self.xslt(output));
                });
            } :
            function (req,res) {
                var session = self.getSession(req,res);
                res.setHeader('Content-Type', session.isJSON ? 'application/json' : 'text/html');
                session.useInput(function() {
                    self.plugins(handlerDef.url, session, handlerDef.handler,function(output) {
                        res.end(session.isJSON ? JSON.stringify(output) : self.xslt(output));
                    });
                });
            };

        switch(handlerDef.method) {
            case "GET": self.app.get(handlerDef.url, functionWrapper); break;
            case "POST": self.app.post(handlerDef.url, functionWrapper); break;
            case "DELETE": self.app.delete(handlerDef.url, functionWrapper); break;
            case "PUT": self.app.put(handlerDef.url, functionWrapper); break;
        }
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
        self.addHandler({"method":"GET", "url":"/", "handler":function(session,callback) {
            callback("<app>"+self.getScriptListXML()+"<mainfeed /></app>");
        }});

        self.addHandler({"method":"GET", "url":"/web.js", "handler":function(session,callback) {
            callback({"error":"no-permission-to-access-file"});
        }});
        self.setupVariables();
        self.initProcesses();
    };

    self.start = function () {
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                (new Date(Date.now() )), self.ipaddress, self.port);
        });
    };
};

try {
    var instance = new WebApplication();
    instance.initialize();
    instance.start();
} catch (error) {
    console.error("Failed to initialize app\n"+error);
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