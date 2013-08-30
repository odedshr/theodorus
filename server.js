var config = require(process.env.theodorus_config_file);
var _ = require("underscore");
var backbone = require("backbone");
var express = require('express'),
    app = express();

var io = {
    "config": config,
    "db": require ('./core/db/DbApi').get(config),
    "qs": require("querystring"),
    "rsa": require("./core/RSA"),

    "useInput": function (req,callback) {
        var body = "";
        req.on('data', function (data) { body +=data; });
        req.on('end',function(){
            var data = (0<body.length) ? io.qs.parse(body) : {};
            //TODO: sanitize input
            //data.forEach(function(value,key,array) { array[key]= });
            callback(data);
        });
    },

    "getCookies": function(req) {
        var cookies = {};
        req.headers && req.headers.cookie.split(';').forEach(function(cookie) {
            var parts = cookie.match(/(.*?)=(.*)$/)
            cookies[ parts[1].trim() ] = (parts[2] || '').trim();
        });
        return cookies;
    },

    "setAuthenticationCookie": function (req,res,userId,remember) {
        var cookieString = JSON.stringify({
            "ip": req.socket.remoteAddress,
            "userId": userId,
            "remember": remember
        });
        res.cookie( config.cookie_token, io.rsa.generateKey(config.rsa_keys).encrypt(cookieString),
                    { maxAge: remember ? 31536000000 : 900000, httpOnly: false}); // remember ? year : 15m
    },

    "getCurrentUserId": function (req,res,callback) {
        var token = this.getCookies(req)[config.cookie_token];
        var token = token ? io.qs.unescape(token) : false;
        var userId = false;
        if (token) {
            try {
                token = JSON.parse(io.rsa.generateKey(config.rsa_keys).decrypt(token));
                if (token.ip==req.socket.remoteAddress) {
                    io.setAuthenticationCookie(req,res,token.userId,token.remember); // re-set the cookie
                    userId = token.userId
                }
            }
             catch (error){
                 //something else was written in the cookie. ignore;
             }
        }
        callback(userId);
    },

    "json": function (jsonObject, res) {
        var jsonString = JSON.stringify(jsonObject);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', jsonString.length);
        res.end(jsonString);
    },

    "jsonHeaders": function ( res) {
        res.setHeader('Content-Type', 'application/json');
    },

    "jsonAppend": function (jsonObject, res) {
        res.end(JSON.stringify(jsonObject));
    },

    "getXsltFile": function () {
        return "/themes/"+config.theme+"/xslt/default.xsl"
    },

    "xslt": function (xmlString, res) {
        var xslt = require('node_xslt');
        var xsltDocument = xslt.readXsltFile(__dirname + this.getXsltFile());
        var xmlDocument = xslt.readXmlString("<xml>"+xmlString+"</xml>");
        var transformedString = xslt.transform( xsltDocument,xmlDocument, []);
        res.setHeader('Content-Type', 'text/html');
        //res.setHeader('Content-Length', transformedString.length);
        res.end(transformedString);
    },

    "send404": function ( req,res ) {
        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
            io.xslt("<app><fileNotFound /></app>",res);
            return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({ "error": 'item-not-found' });
            return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');

    }
};


function getMethodNotImplementedMessage (req,res) {
    io.json ({"error":"not-implemented","method":req.method+"/"+req.url}, res);
}

app.use(express.cookieParser());

app.get('/', function(req, res){
    io.xslt("<app mode='"+config.mode+"'><mainfeed /></app>",res); });

app.get('/server.js', function(req, res){ io.json ({"error":"no-permission-to-access-file"}, res); });

/* the client doesn't need to know the name of the current theme to work by redirect current-theme calls to it:*/
//req.protocol + "://" + req.get('host') + ":" +req.port + "/" +
app.get(/^[\/]{1,2}ui\/.*$/, function(req, res){ res.redirect(req.url.replace(/[\/]{1,2}ui\//,"/themes/"+config.theme+"/"));
});

// user actions
["processes/user/AccountProcess",
 "processes/user/UserProcess",
 "processes/topic/TopicProcess"].forEach( function(libraryName) {
        require("./core/"+libraryName).init(io).forEach( function (item) {
        switch(item.method) {
            case "GET": app.get(item.url, item.handler); break;
            case "POST": app.post(item.url, item.handler); break;
            case "DELETE": app.delete(item.url, item.handler); break;
            case "PUT": app.put(item.url, item.handler); break;
        }
    })
});

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