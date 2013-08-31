var io = null,
    Topic = require("../../models/Topic").model();

exports.init = function (ioFunctions) {
    io = ioFunctions;
    return [
        {"method":"GET","url":"/topics","handler":getTopics},
        {"method":"POST","url":"/topics","handler":addTopic},
        {"method":"GET","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/exists\/?$/,"handler":isExists},
        {"method":"GET","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/?$/,"handler":getTopic},
        {"method":"GET","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/edit\/?$/,"handler":getTopicForEdit},
        {"method":"GET","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/edit\/?$/,"handler":setTopic},
        {"method":"POST","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/follow\/?$/,"handler":follow},
        {"method":"DELETE","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/follow\/?$/,"handler":unfollow},
        {"method":"POST","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/like\/?$/,"handler":like},
        {"method":"DELETE","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/like\/?$/,"handler":unlike},
        {"method":"POST","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/report\/?$/,"handler":report},
        {"method":"DELETE","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/report\/?$/,"handler":unreport},
        {"method":"GET","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/comments\/?$/,"handler":getComments},
        {"method":"GET","url":/^\/\*[a-zA-Z0-9_-]{3,140}\/invite\/@[a-zA-Z0-9_-]{3,15}\/?$/,"handler":invite}
    ]
}

function getTopics(req,res) {
    io.jsonHeaders(res);
    io.db.getTopics(function(items) {
        if (items) {
            io.jsonAppend(items,res);
        } else {
            io.jsonAppend({"error":"error-getting-topics"},res);
        }
    })
}

function addTopic(req,res) {
    io.jsonHeaders(res);
    io.getCurrentUserId(req,res,function(userId) {
        //TODO: do you have permissions?
        io.useInput(req,function (data) {
            //TODO: validate input + saftify!!!
            var createDate = (new Date()).toISOString();
            var topic = new Topic({
                "created": createDate,
                "modified":createDate,
                "initiator":userId,
                "title":data.title,
                "slug":data.slug,
                "endorsements":0,
                "follows":0,
                "reports":0,
                "tags":data.tags.split(" ")});
            if (data.slug.length===0) {
                io.jsonAppend({"error":"slug-is-too-short"},res);
            } else if (!Topic.isSlugValid(data.slug)) {
                io.jsonAppend({"error":"slug-is-invalid"},res);
            } else {
                io.db.load(Topic,{"slug":data.slug}, function (result) {
                    if (result) {
                        io.jsonAppend({"error":error},res);
                    } else {
                        io.db.save(topic,function (result,error){
                            if (result) {
                                io.jsonAppend({"error":"success", "topic":result.toJSON()},res);
                            } else {
                                console.error("error saving topic" + JSON.stringify(error));
                                io.jsonAppend({"error":error},res);
                            }
                        });
                    }
                });
            }
        });
    });
}

function isExists (req,res) {
    var url = req.url;
    url = url.replace(/^http[s]?:\/\/([\da-z\.-]+)(:(\d)*)?\/\*/,"");
    url = url.replace(/\/exists\/?$/,"");
    if (Topic.URL.isValid(slug)) {
        io.db.load(Topic.URL,url,function (found) {
            if (found) {
                io.json({"result": "slug-exists" },res);
            } else {
                io.json({"result": "slug-is-available" },res);
            }
        })
    } else {
        io.json({"result": "slug-is-invalid" },res);
    }
}
function getTopic(req,res) {
    io.send404(req,res);
}
function getTopicForEdit(req,res) { io.json({"error":"method-not-implemented"},res);}
function setTopic(req,res) { io.json({"error":"method-not-implemented"},res);}
function follow(req,res) { io.json({"error":"method-not-implemented"},res);}
function unfollow(req,res) { io.json({"error":"method-not-implemented"},res);}
function like(req,res) { io.json({"error":"method-not-implemented"},res);}
function unlike(req,res) { io.json({"error":"method-not-implemented"},res);}
function report(req,res) { io.json({"error":"method-not-implemented"},res);}
function unreport(req,res) { io.json({"error":"method-not-implemented"},res);}
function getComments(req,res) { io.json({"error":"method-not-implemented"},res);}
function invite(req,res) { io.json({"error":"method-not-implemented"},res);} //  case "post/topic/##/invite/[person]": // {invite-message}
