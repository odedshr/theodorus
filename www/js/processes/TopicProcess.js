var io = null,
    Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
    Comment = (typeof Comment !== "undefined") ? Comment : require("../models/Comment").model(),
    _ = (typeof _ !== "undefined") ? _ : require("underscore");

var TopicProcess = (function () {
    return {
        init: function (ioFunctions) {
            io = ioFunctions;
            return [
                {"method":"GET",  "url":"/",                                                        "handler":TopicProcess.getMainPage.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/topics(\/:\d+)?\/?$/,                                   "handler":TopicProcess.getTopics.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/topics\/add\/?$/,                                   "handler":TopicProcess.getAddTopicPage.bind(TopicProcess)},
                {"method":"POST", "url":/^\/topics\/?$/,                                            "handler":TopicProcess.addTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/\*[a-zA-Z0-9_-]{3,140}\/exists\/?$/,                    "handler":TopicProcess.isExists.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,              "handler":TopicProcess.getTopic.bind(TopicProcess)},
                {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,              "handler":TopicProcess.removeTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/remove\/?$/,        "handler":TopicProcess.removeTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicProcess.getTopicForEdit.bind(TopicProcess)},
                {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicProcess.setTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?follow\/?$/,         "handler":TopicProcess.follow.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?endorse\/?$/,        "handler":TopicProcess.endorse.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?report\/?$/,         "handler":TopicProcess.report.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/?$/,            "handler":TopicProcess.getComments.bind(TopicProcess)},
                {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(\d+\/)?comment\/?$/,    "handler":TopicProcess.addComment.bind(TopicProcess)},
                {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/?$/,         "handler":TopicProcess.removeComment.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/remove\/?$/,    "handler":TopicProcess.removeComment.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/invite\/@[a-zA-Z0-9_-]{3,15}\/?$/,    "handler":TopicProcess.invite.bind(TopicProcess)}
            ]
        },

        getMainPage: function getMainPage(session,callback) {
            var tasks = [   {"method":"get","url":"/topics","outputName":"topics"},
                            {"method":"get","url":"/me","outputName":"me"},
                            {"method":"get","url":"/tags","outputName":"tags"}
                        ],
                taskCount = tasks.length,
                taskOutput = {},
                taskCompleted = function taskCompleted() {
                    if (!(--taskCount)) {
                        callback({
                            "app":{
                                "mode": io.getTheodorusMode(),
                                "page": {
                                    "@type":"feed",
                                    "topics": { "topic": taskOutput.topics },
                                    "tags": { "tag": taskOutput.tags },
                                    "user":taskOutput.me
                                }
                            }
                        });
                    }
                };
            tasks.forEach(function (task) {
                (io.getHandler(task.method,task.url))(session, function (output) {
                    taskOutput[task.outputName] = output;
                    taskCompleted();
                } );
            });
        },

        getAddTopicPage: function getMainPage(session,callback) {
            var tasks = [   {"method":"get","url":"/me","outputName":"me"},
                            {"method":"get","url":"/tags","outputName":"tags"}
                        ],
                taskCount = tasks.length,
                taskOutput = {},
                taskCompleted = function taskCompleted() {
                    if (!(--taskCount)) {
                        if (taskOutput.me.can("suggest")) {
                            console.log("can suggest");
                            callback({
                                "app":{
                                    "mode": io.getTheodorusMode(),
                                    "page": {
                                        "@type":"addTopic",
                                        "tags": { "tag": taskOutput.tags },
                                        "user":taskOutput.me
                                    }
                                }
                            });
                        } else {
                            console.log("cannot suggest");
                            callback({
                                "app":{
                                    "mode": io.getTheodorusMode(),
                                    "page": {
                                        "@type":"addTopic",
                                        "tags": { "tag": taskOutput.tags },
                                        "user":taskOutput.me
                                    }
                                }
                            });
                        }

                    }
                };
            tasks.forEach(function (task) {
                (io.getHandler(task.method,task.url))(session, function (output) {
                    taskOutput[task.outputName] = output;
                    taskCompleted();
                } );
            });
        },

        getTopics: function (session,callback) {
            session.useUserId(function(userId) {
                io.db.getTopics ({
                    "user" : userId
                },function (items) {
                    if (items) {
                        callback(items);
                    } else {
                        callback(session.getErrorHandler("error-getting-topics"));
                    }
                }, parseInt(session.url.replace(/\D/g,"")));
            });
        },

        addTopic: function (session,callback) {
           var input = session.input;
            input.slug = encodeURIComponent (input.title.replace(/\s/g,"-").replace(/[()!@#$%^&\*\+=\[\]\{\}`~\';"|\\\/\.]/g,"")).substr(0, io.config.maximum_slug_length);
           if (input.title.length< io.config.minimum_topic_title_length) {
              callback(session.getErrorHandler("title-too-short","title",input.title));
            } else if (input.title.length> io.config.maximum_topic_title_length) {
               callback(session.getErrorHandler("title-too-long","title",input.title));
            } else if (!Topic.isSlugValid(input.slug)) {
               callback(session.getErrorHandler("slug-is-invalid","slug",input.slug));
            } else {
                io.db.load(Topic,{"slug":input.slug}, function (result) {
                    if (result) {
                        callback(session.getErrorHandler("slug-not-available"));
                    } else {
                        session.useUserId(function(userId) {
                            io.db.getAccount(userId,function (user) {
                                session.user = user;
                                if (user && user.can("suggest")) {
                                    //TODO: validate input + saftify!!!
                                    var createDate = (new Date()).toISOString(),
                                        topic = new Topic({
                                            "created": createDate,
                                            "modified":createDate,
                                            "initiator":userId,
                                            "title":input.title,
                                            "slug":input.slug,
                                            "tags":input.tags ? input.tags.split(" ") : []
                                        });
                                    io.db.save(topic,function (result,error){
                                        if (result) {
                                            if (session.isJSON) {
                                                callback(result.toJSON());
                                            } else {
                                                session.res.writeHead(301,{location: session.req.headers['referer']});
                                                callback({});
                                            }
                                        } else {
                                            callback(session.getErrorHandler(error,"input",input));
                                        }
                                    });
                                } else {
                                    callback(session.getErrorHandler("no-permission"));
                                }
                            });
                        });
                     }
                });
            }
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
            var topicKey = this.getTopicIndexByUrl(session.url),
                tasks = [   {"method":"get","url":"/me","outputName":"me"},
                            {"method":"get","url":"/tags","outputName":"tags"}
                ],
                taskCount = tasks.length,
                taskOutput = {},
                taskCompleted = function taskCompleted() {
                    if (!(--taskCount)) {
                        io.db.getTopic(topicKey, function (topic){
                            if (topic) {
                                io.db.getTopicRead(topic.id, function(topicRead){
                                    topic.set("content",topicRead.content);
                                    if (session.isJSON) {
                                        callback(topic.toJSON());
                                    } else {
                                        io.db.getComments(topic.id,taskOutput.me.user_id, function (comments) {
                                            callback ({
                                                "app":{
                                                    "mode": io.getTheodorusMode(),
                                                    "page": {
                                                        "@type":"topicView",
                                                        "topic": topic.toJSON(),
                                                        "comments": { "comment": comments},
                                                        "tags": { "tag": taskOutput.tags },
                                                        "user":taskOutput.me,
                                                        "server": "http"+(session.req.connection.encrypted?"s":"")+"://" + session.req.headers.host
                                                    }
                                                }
                                            })

                                        });
                                    }
                                });
                            } else {
                                callback(session.get404());
                            }
                        });
                    }
                };
            if (topicKey.error) {
                callback(session.getErrorHandler(topicKey.error));
            } else if (tasks.length>0) {
                tasks.forEach(function (task) {
                    (io.getHandler(task.method,task.url))(session, function (output) {
                        taskOutput[task.outputName] = output;
                        taskCompleted();
                    } );
                });
            } else {
                taskCompleted();
            }

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

        getTopicForEdit: function (session,callback) {
            callback("<app>"+io.getScriptListXML()+"<topicEdit /></app>");
        },

        setTopic: function (session,callback) { callback({"error":"method-not-implemented"});},


        setUserTopicAttribute :function (session,callback,attribute,value) {
            var topicKey = this.getTopicIndexByUrl(session.url);
            if (topicKey.error) {
                callback(session.getErrorHandler(topicKey));
                callback();
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
                                            if (session.isJSON) {
                                                callback ({
                                                    "key":attribute,
                                                    "value":(value ? value : 0)
                                                });
                                            } else {
                                                session.res.writeHead(301,{location: session.req.headers['referer']});
                                                callback({});
                                            }
                                        } else {
                                            callback (topicSaveResult);
                                        }
                                    });

                                })
                            }
                        });
                    } else {
                        callback(session.getErrorHandler("topic-not-found"));
                    }
                })
            });
        },

        addComment: function addComment (session,callback) {
            var source = session.req.headers["referer"];
                input = session ? session.input : false;

            if (!session.input || !session.input.parent_id) {
                callback (session.isJSON ? {"error":"no-input"} : session.getErrorHandler("no-input"));
            } else {
                var createDate = (new Date()).toISOString(),
                    parentId = input.parent_id,
                    content = input["comment_on-"+parentId];
                if (content.length)
                if (content.length< io.config.minimum_comment_length) {
                    callback(session.getErrorHandler("comment-too-short","comment",content));
                } else if (content.length> io.config.maximum_comment_length) {
                    callback(session.getErrorHandler("comment-too-long","comment",content));
                } else {
                    session.useUserId(function(userId) {
                        io.db.getAccount(userId,function (user) {
                            if (user.can("comment")) {
                                var comment = new Comment({
                                    "created": createDate,
                                    "user_id":userId,
                                    "topic_id":input.topic_id,
                                    "parent_id":parentId,
                                    "content":content
                                });
                                io.db.save(comment,function (result,error){
                                    if (result) {
                                        if (session.isJSON) {
                                            callback(result.toJSON());
                                        } else {
                                            session.res.writeHead(301,{location: source});
                                            callback({});
                                        }
                                    } else {
                                        console.error("error saving comment" + JSON.stringify(error));
                                        callback({"error":error});
                                    }
                                });
                            } else {
                                callback (session.isJSON ? {"error":"no-permission"} : session.getErrorHandler("no-permission"));
                            }
                        });
                    });
                }
            }
        },
        follow: function follow     (session,callback) { this.setUserTopicAttribute(session,callback,"follow",session.url.indexOf("/follow")!=-1); },
        endorse: function endorse   (session,callback)   { this.setUserTopicAttribute(session,callback,"endorse",session.url.indexOf("/endorse")!=-1); },
        report: function report     (session,callback) { this.setUserTopicAttribute(session,callback,"report",session.url.indexOf("/report")!=-1); },
        getComments: function getComments (session,callback) { callback({"error":"method-not-implemented"});},
        invite: function invite     (session,callback) { callback({"error":"method-not-implemented"});}, //  case "post/topic/##/invite/[person]": // {invite-message}

        removeTopic: function removeTopic (session, callback) {
            io.db.getTopic(this.getTopicIndexByUrl(session.url), function (topic){
                if (topic) {
                    session.useUserId(function(userId) {
                        if (userId == topic.get("initiator")) {
                            if (topic.get("endorse")== 0 && topic.get("follow")== 0 && topic.get("comment")== 0) {
                                topic.set("status","removed");
                                topic.set("report_status","selfcensor");
                                io.db.save(topic,function (result,error) {
                                    if (result) {
                                        if (session.isJSON) {
                                            callback(result.toJSON());
                                        } else {
                                            session.res.writeHead(301,{location: session.req.headers['referer']});
                                            callback({});
                                        }
                                    } else {
                                        console.error("error saving topic" + JSON.stringify(error));
                                        callback({"error":error});
                                    }
                                });
                            } else {
                                callback(session.getErrorHandler("cannot-remove-item"));
                            }
                        } else {
                            console.log(userId + " !=" + JSON.stringify(topic.toJSON())+ ","+ topic.get("initiator"));
                            callback(session.getErrorHandler("cannot-remove-item"));
                        }
                        //callback ({"error":"t"+topic.initiator+"<br/>,u:"+userId});
                    });
                } else {
                    callback(session.get404());
                }
            });
        },

        removeComment: function removeTopic (session, callback) {
            var urlNumbers = session.url.match(/\d+/g),
                commentId = +urlNumbers[urlNumbers.length-1];
            io.db.load(Comment, commentId, function (comment) {
                // TODO: verify topic id (you need to load topic in case you're only holding the slug)
                // TODO: load items that have parent_id= commentId as well, if count>1, cancel operation
                if (comment) {
                    session.useUserId(function(userId) {
                        if (userId == comment.get("user_id")) {
                            if (comment.get("endorse")== 0 && comment.get("follow")== 0 ) {
                                comment.set("report_status","selfcensor");
                                io.db.save(comment,function (result,error) {
                                    if (result) {
                                        if (session.isJSON) {
                                            callback(result.toJSON());
                                        } else {
                                            session.res.writeHead(301,{location: session.req.headers['referer']});
                                            callback({});
                                        }
                                    } else {
                                        console.error("error saving comment" + JSON.stringify(error));
                                        callback({"error":error});
                                    }
                                });
                            } else {
                                callback(session.getErrorHandler("cannot-remove-item"));
                            }
                        } else {
                            console.log(userId + " !=" + JSON.stringify(comment.toJSON())+ ","+ comment.get("user_id"));
                            callback(session.getErrorHandler("cannot-remove-item"));
                        }
                        //callback ({"error":"t"+topic.initiator+"<br/>,u:"+userId});
                    });
                } else {
                    callback(session.get404());
                }
            });

        }
    };
}());

if (typeof exports !== "undefined") {
    exports.init = TopicProcess.init.bind(TopicProcess);
}