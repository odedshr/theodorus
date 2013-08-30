var io = null,
    User = require("../../models/User").class;

exports.init = function (ioFunctions) {
    io = ioFunctions;
    var methods = []; //I'm using push because of an annoying compiler warning
    methods.push({"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/?$/,"handler":getUser});
    methods.push({"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/topics\/?$/,"handler":getUserTopics});
    methods.push({"method":"POST","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":follow});
    methods.push({"method":"DELETE","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":unfollow});
    return methods;
}

function getUser(req,res) { io.json({"error":"method-not-implemented"},res);}

function getUserTopics(req,res) { io.json({"error":"method-not-implemented"},res);}
function follow(req,res) { io.json({"error":"method-not-implemented"},res);}
function unfollow(req,res) { io.json({"error":"method-not-implemented"},res);}