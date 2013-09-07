var io = null,
    Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
    _ = (typeof _ !== "undefined") ? _ : require("underscore");

var TopicProcess = (function () {
    return {
        getTopics: function (session,callback) {
            io.db.getTopics (function (items) {
                if (items) {
                    callback(items);
                } else {
                    callback({"error":"error-getting-topics"});
                }
            });
        },

        addTopic: function (session,callback) {
            session.useUserId(function(userId) {
                //TODO: do you have permissions?
                var input = session.input;
                //TODO: validate input + saftify!!!
                var createDate = (new Date()).toISOString();
                var topic = new Topic({
                    "created": createDate,
                    "modified":createDate,
                    "initiator":userId,
                    "title":input.title,
                    "slug":input.slug,
                    "endorsements":0,
                    "follows":0,
                    "reports":0,
                    "tags":input.tags.split(" ")});
                if (input.slug.length===0) {
                    callback({"error":"slug-is-too-short"});
                } else if (!Topic.isSlugValid(data.slug)) {
                    callback({"error":"slug-is-invalid"});
                } else {
                    io.db.load(Topic,{"slug":data.slug}, function (result) {
                        if (result) {
                            callback({"error":error});
                        } else {
                            io.db.save(topic,function (result,error){
                                if (result) {
                                    callback(result.toJSON());
                                } else {
                                    console.error("error saving topic" + JSON.stringify(error));
                                    callback({"error":error});
                                }
                            });
                        }
                    });
                }
            });
        },

        isExists: function  (session,callback) {
            var url = session.url;
            url = url.replace(/^(http[s]?:\/\/([\da-z\.-]+)(:(\d)*)?)?\/\*/,"");
            url = url.replace(/\/exists\/?$/,"");
            if (Topic.isSlugValid(url)) {
                io.db.load(Topic,{slug:url},function (found) {
                    if (found) {
                        callback({"result": "slug-exists" });
                    } else {
                        callback({"result": "slug-is-available" });
                    }
                })
            } else {
                callback({"result": "slug-is-invalid"});
            }
        },
        getTopic: function (session,callback) {
            callback(session.get404());
        },
        getTopicIndexByUrl: function (url) {
            var regexMatch;
            if (regexMatch = url.match(/\*([a-zA-Z0-9_-]{3,140})\/?/)) {
                return {"slug":regexMatch[1]};
            }
            if (regexMatch = url.match(/topics\/(\d+)/)) {
                return {"topic_id":regexMatch[1]};
            }
            return {"error":"url-parse-failed"}
        },
        getTopicForEdit: function (session,callback) { callback({"error":"method-not-implemented"});},
        setTopic: function (session,callback) { callback({"error":"method-not-implemented"});},


        setUserTopicAttribute :function (session,callback,attribute,value) {
            var topicKey = this.getTopicIndexByUrl(session.url);
            if (topicKey.error) {
                callback(topicKey);
                return;
            }
            session.useUserId(function(userId) {
                //TODO: check user permissions
                io.db.getTopic(topicKey, function (topic){
                    if (topic) {
                        var topicId = topic.get("topic_id");
                        io.db.setUserTopic(userId,topicId,attribute,value,function (output){
                            if (!output) {
                                console.error("failed to save user-topic");
                                callback ({"error":"operation-failed"});
                            } else {
                                io.db.getTopicStatistics(topicId, function (statistics) {
                                    var value = statistics[attribute];
                                    topic.set(attribute,(value ? value : 0));
                                    //TODO: topic.score on user feedback is calculated real-time
                                    //TODO: update user_topic.score
                                    //TODO: update user.score
                                    io.db.save(topic, function(topicSaveResult){
                                        if (!topicSaveResult.error) {
                                            callback ({
                                                "key":attribute,
                                                "value":(value ? value : 0)
                                            });
                                        } else {
                                            callback (topicSaveResult);
                                        }
                                    });

                                })
                            }
                        });
                    } else {
                        callback ({"error":"topic-not-found"});
                    }
                })
            });
        },

        follow: function (session,callback) { this.setUserTopicAttribute(session,callback,"follow",session.url.indexOf("/follow")!=-1); },
        endorse: function (session,callback)   { this.setUserTopicAttribute(session,callback,"endorse",session.url.indexOf("/endorse")!=-1); },
        report: function (session,callback) { this.setUserTopicAttribute(session,callback,"report",session.url.indexOf("/report")!=-1); },
        getComments: function (session,callback) { callback({"error":"method-not-implemented"});},
        invite: function (session,callback) { callback({"error":"method-not-implemented"});} //  case "post/topic/##/invite/[person]": // {invite-message}
    };
}());

if (typeof exports !== "undefined") {
    exports.init = function (ioFunctions) {
        io = ioFunctions;
        return [
            {"method":"GET",  "url":/^\/topics\/?$/,                                            "handler":TopicProcess.getTopics.bind(TopicProcess)},
            {"method":"POST", "url":/^\/topics\/?$/,                                            "handler":TopicProcess.addTopic.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/\*[a-zA-Z0-9_-]{3,140}\/exists\/?$/,                    "handler":TopicProcess.isExists.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,              "handler":TopicProcess.getTopic.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicProcess.getTopicForEdit.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicProcess.setTopic.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?follow\/?$/,    "handler":TopicProcess.follow.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?endorse\/?$/,   "handler":TopicProcess.endorse.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?report\/?$/,    "handler":TopicProcess.report.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/?$/,    "handler":TopicProcess.getComments.bind(TopicProcess)},
            {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/invite\/@[a-zA-Z0-9_-]{3,15}\/?$/,    "handler":TopicProcess.invite.bind(TopicProcess)}
        ]
    }
}
