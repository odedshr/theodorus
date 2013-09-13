var appConfig = require("../application.json"),
    config = require(appConfig.privateSettings),
    _ = require("underscore"),
    express = require('express'),
    xslt = require('node_xslt'),
    app = express();

app.use(express.cookieParser());

/* the client doesn't need to know the name of the current theme to work by redirect current-theme calls to it:*/
//req.protocol + "://" + req.get('host') + ":" +req.port + "/" +
app.get(/^[\/]{1,2}ui\/.*$/, function(req, res){ res.redirect(req.url.replace(/[\/]{1,2}ui\//,"/themes/"+config.theme+"/"));
});

var WebApplication = (function () {
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
                this.res.cookie( config.cookie_token, WebApplication.rsa.generateKey(config.rsa_keys).encrypt(cookieString),
                    { maxAge: remember ? 31536000000 : 900000, httpOnly: false}); // remember ? year : 15m
                return true;
            } else {
                var cookies = {};
                this.req.headers && this.req.headers.cookie.split(';').forEach(function(cookie) {
                    var parts = cookie.match(/(.*?)=(.*)$/);
                    cookies[ parts[1].trim() ] = (parts[2] || '').trim();
                });
                return cookies[config.cookie_token];
            }
        };

        this.useInput = function (callback) {
            var body = "";
            var This = this;
            this.req.on('data', function (data) { body +=data; });
            this.req.on('end',function(){
                var data = (0<body.length) ? WebApplication.qs.parse(body) : {};
                //TODO: sanitize input
                This.input = data;
                callback(data);
            });
        };

        this.useUserId =  function (callback) {
            var token = this.cookie(),
                userId= false;
            if (token = (token ? WebApplication.qs.unescape(token) : false)) {
                try {
                    token = JSON.parse(WebApplication.rsa.generateKey(WebApplication.config.rsa_keys).decrypt(token));
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
            return this.isJSON ? { "error": 'item-not-found' } : "<app >"+WebApplication.getScriptListXML()+"<fileNotFound /></app>";
        }
    }

    return {
        "config": config,
        "crypto" : require("crypto"),
        "qs" : require("querystring"),
        "db" : require ('./js/db/DbApi').get(config),
        "rsa" : require("./js/RSA"),

        "getScriptList": function () {
            return (this.config.mode=="dev") ? appConfig.clientScripts : appConfig.clientScriptsDebug;

        },
        "getScriptListXML": function () {
            var list = this.getScriptList();
            var xml = "";
            list.forEach(function(script) {
                xml+= "<script src='"+script+"' />";
            });
            return xml;
        },
        "plugins" : function (url,session,mainFunc,callback) {
            mainFunc(session,function(output) {
                callback(output);
            });
        },
        "xslt" : function (xmlString) {
            if (typeof xmlString === "object") {
                return "<pre>"+JSON.stringify(xmlString)+"</pre>";
            }
            var xsltDocument = xslt.readXsltFile(__dirname + "/themes/"+config.theme+"/xslt/default.xsl");
            var xmlDocument = xslt.readXmlString("<xml>"+xmlString+"</xml>");
            return xslt.transform( xsltDocument,xmlDocument, [])
        },
        "getSession" : function (req, res) {
            return new Session(req,res);
        },
        "addHandler": function (handlerDef) {
            var This = this;
            var functionWrapper = (handlerDef.method=="GET" || handlerDef.method=="DELETE") ?
                function (req,res) {
                    var session = This.getSession(req,res);
                    res.setHeader('Content-Type', session.isJSON ? 'application/json' : 'text/html');
                    This.plugins(handlerDef.url, session, handlerDef.handler,function(output) {
                        res.end(session.isJSON ? JSON.stringify(output) : This.xslt(output));
                    });
                } :
                function (req,res) {
                    var session = This.getSession(req,res);
                    res.setHeader('Content-Type', session.isJSON ? 'application/json' : 'text/html');
                    session.useInput(function() {
                        This.plugins(handlerDef.url, session, handlerDef.handler,function(output) {
                            res.end(session.isJSON ? JSON.stringify(output) : This.xslt(output));
                        });
                    });
                };

            switch(handlerDef.method) {
                case "GET": app.get(handlerDef.url, functionWrapper); break;
                case "POST": app.post(handlerDef.url, functionWrapper); break;
                case "DELETE": app.delete(handlerDef.url, functionWrapper); break;
                case "PUT": app.put(handlerDef.url, functionWrapper); break;
            }
        },
        "initProcesses": function () {
            var This = this;
            appConfig.processes.forEach( function(libraryName) {
                require("./js/"+libraryName).init(This).forEach(This.addHandler.bind(This));
            });
        }
    };
}());

WebApplication.initProcesses();

WebApplication.addHandler({"method":"GET", "url":"/", "handler":function(session,callback) {
    xml = WebApplication.getScriptListXML();
    callback("<app>"+xml+"<mainfeed /></app>");
}});

WebApplication.addHandler({"method":"GET", "url":"/web.js", "handler":function(session,callback) {
    callback({"error":"no-permission-to-access-file"});
}});


function getMethodNotImplementedMessage (req,res) {
    res.setHeader('Content-Type', 'application/json' );
    res.end(JSON.stringify({"error":"not-implemented","method":req.method+"/"+req.url}));
}
// tags actions
app.get("/tags", getMethodNotImplementedMessage);
app.get("/tags/dictionary", getMethodNotImplementedMessage);
// get items by tag
app.get(/^\/#[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
// comments
app.get(/^\/~[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
// search
app.get(/^\/\?[a-zA-Z0-9_-]{1,140}\/?$/, getMethodNotImplementedMessage);
// errors
app.get(/^\/![a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage ); // case "post/error/": // {message, screenshot}

app.use(express.static(__dirname ));

app.listen(config.port);