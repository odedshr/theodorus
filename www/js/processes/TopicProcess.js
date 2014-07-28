var io = null,
    Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
    Comment = (typeof Comment !== "undefined") ? Comment : require("../models/Comment").model(),
    _ = (typeof _ !== "undefined") ? _ : require("underscore"),
    TOPIC_PAGE_SIZE = 0;

var TopicProcess = (function () {
    return {
        init: function (ioFunctions) {
            io = ioFunctions;
            TOPIC_PAGE_SIZE  = (io.config.topic_page_size) ? io.config.topic_page_size : TOPIC_PAGE_SIZE;

            return [
                {"method":"GET",  "url":/^\/(:\d+\/?)?$/,                                           "handler":TopicProcess.getTopics.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/topics\/count\/?$/,                                     "handler":TopicProcess.getTopicCount.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/topics(:\d+)?\/?$/,                                     "handler":TopicProcess.getTopics.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/topics\/add\/?$/,                                       "handler":TopicProcess.getAddTopicPage.bind(TopicProcess)},
                {"method":"POST", "url":/^\/topics\/?$/,                                            "handler":TopicProcess.addTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/\*[a-zA-Z0-9_-]{3,140}\/exists\/?$/,                    "handler":TopicProcess.isExists.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,              "handler":TopicProcess.getTopic.bind(TopicProcess)},
                {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,           "handler":TopicProcess.removeTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/remove\/?$/,      "handler":TopicProcess.removeTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/read\/?$/,        "handler":TopicProcess.getTopicForRead.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicProcess.getTopicForEdit.bind(TopicProcess)},
                {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,       "handler":TopicProcess.setTopic.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?follow\/?$/,         "handler":TopicProcess.follow.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?endorse\/?$/,        "handler":TopicProcess.endorse.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?report\/?$/,         "handler":TopicProcess.report.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/?$/,            "handler":TopicProcess.getComments.bind(TopicProcess)},
                {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(\d+\/)?comment\/?$/,    "handler":TopicProcess.addComment.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/?$/,         "handler":TopicProcess.getComment.bind(TopicProcess)},
                {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/?$/,         "handler":TopicProcess.removeComment.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/remove\/?$/,    "handler":TopicProcess.removeComment.bind(TopicProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/invite\/@[a-zA-Z0-9_-]{3,15}\/?$/,    "handler":TopicProcess.invite.bind(TopicProcess)},
            ]
        },

        plugins: function plugins () {
            return [
                {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TopicProcess.pGetComments.bind(TopicProcess)},
            ];
        },

        getTopicCount: function getTopicCount (session,callback) {
            io.db.getTopicCount(function(count){
                callback({"count":count});
            });
        },

        getAddTopicPage: function getMainPage(session,callback) {
            session.useUserAccount(function(user) {
                if (user && user.can("suggest")) {
                    callback({
                        "app":{
                            "page": {
                                "@type":"addTopic"
                            }
                        }
                    });
                } else {
                    callback(session.getErrorHandler("no-permissions"));
                }
            });
        },

        getTopics: function (session,callback) {
            session.useUserId(function(userId) {
                var page = Math.max(1,parseInt(session.url.replace(/\D/g,"")*1)),
                    parameters = {
                        "user" : userId,
                        "pageSize" : TOPIC_PAGE_SIZE,
                        "page": page
                    };

                io.db.getTopics (parameters,function (topics) {
                    if (topics) {
                        io.db.getTopicCount(function(count){
                            var output = {
                                "topics": { "topic": topics },
                                "pageIndex": page,
                                "pageCount": Math.ceil(count / TOPIC_PAGE_SIZE)
                            }
                            callback(session.isJSON ? output : {
                                "app":{
                                    "page": _.extend(output, {
                                        "@type":"feed"
                                    })
                                }
                            });
                        });

                    } else {
                        callback(session.getErrorHandler("error-getting-topics"));
                    }
                }, page);
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
                                                callback({  "directive":"redirect",
                                                            "location":"referer"});
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
            var referer = session.req.headers["referer"],
                topicKey = this.getTopicIndexByUrl(session.url);

            if (topicKey.error) {
                callback(session.getErrorHandler(topicKey.error));
            } else {
                io.db.getTopic(topicKey, function (topic){
                    if (topic) {
                        var topicId = topic.get("topic_id");
                        io.db.getTopicRead(topicId, function(topicRead){
                            topic.set("content",topicRead);
                            callback(session.isJSON ? topic.toJSON() : {
                                "app":{
                                    "page": {
                                        "@type":"topicView",
                                        "topic": topic.toJSON()
                                    }
                                }
                            });
                        });
                    } else {
                        callback(session.get404());
                    }
                });
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

        getTopicForRead: function getTopicForRead (session,callback) {
            //TODO: allow accepting TopicSlug as input
            var topicKey = this.getTopicIndexByUrl(session.url);

            io.db.getTopicRead(topicKey.topic_id, function(topicRead){
                callback(topicRead ? topicRead : "");
            });
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
                                session.log("failed to save user-topic" +JSON.stringify({"user":userId,"topic":topicId,"attribute":attribute,"value":value}),"error");
                                callback(session.getErrorHandler("operation-failed"));
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
                                                callback({  "directive":"redirect",
                                                            "location":"referer"});
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

        getComment: function getComment (session,callback) {
            var commentId = parseInt(session.url.match(/(\d+)/g)[1]);
            if (typeof commentId == "undefined") {
                callback(session.getErrorHandler("comment-not-found"));
            }
            if (session.isJSON) {
                io.db.load(Comment, commentId, function commentLoaded(comment) {
                    callback(comment);
                });
            } else {
                TopicProcess.getTopic(session, function topicLoaded(pageInfo) {
                   pageInfo.app.page.commentId = commentId;
                   pageInfo.app.page.referer = session.req.headers["referer"];
                   callback(pageInfo);
                });
            }
        },

        addComment: function addComment (session,callback) {
            var input = session ? session.input : false,
                source = session.req.headers["referer"]; //input.referer ? _.unescape(input.referer) : session.req.headers["referer"];

            if (!session.input || !(session.input.parent_id|| session.input.comment_id)) {
                callback (session.isJSON ? {"error":"no-input"} : session.getErrorHandler("no-input"));
            } else {
                var createDate = (new Date()).toISOString(),
                    topicId = input.topic_id,
                    parentId = input.parent_id ? input.parent_id : 0,
                    content = input["comment_on-"+parentId];
                if (content.length< io.config.minimum_comment_length) {
                    callback(session.getErrorHandler("comment-too-short","comment",content));
                } else if (content.length> io.config.maximum_comment_length) {
                    callback(session.getErrorHandler("comment-too-long","comment",content));
                } else {
                    session.useUserId(function(userId) {
                        if (!userId) {
                            callback (session.getErrorHandler("user-not-found"));
                        }
                        io.db.getAccount(userId,function (user) {
                            if (user.can("comment")) {
                                var comment = new Comment({
                                    "created": createDate,
                                    "user_id":userId,
                                    "topic_id":topicId,
                                    "parent_id":parentId,
                                    "content":content
                                });
                                io.db.save(comment,function (result,error){
                                    if (result) {
                                        io.db.updateTopicCommentCount(topicId,function(){});

                                        if (session.isJSON) {
                                            callback(result.toJSON());
                                        } else {
                                            callback({  "directive":"redirect",
                                                        "location":"referer"});
                                        }
                                    } else {
                                        callback (session.getErrorHandler(error));
                                    }
                                });
                            } else {
                                callback (session.getErrorHandler("no-permission"));
                            }
                        });
                    });
                }
            }
        },
        follow: function follow     (session,callback) { this.setUserTopicAttribute(session,callback,"follow",session.url.indexOf("/follow")!=-1); },
        endorse: function endorse   (session,callback)   { this.setUserTopicAttribute(session,callback,"endorse",session.url.indexOf("/endorse")!=-1); },
        report: function report     (session,callback) { this.setUserTopicAttribute(session,callback,"report",session.url.indexOf("/report")!=-1); },

        getComments: function getComments (session,callback) {
            var topicKey = this.getTopicIndexByUrl(session.url);
            session.useUserId(function (userId) {
                io.db.getComments(topicKey.topic_id,userId, function (comments) {
                    callback(comments);
                });
            });
        },

        pGetComments: function getComments (session, nextHandler, callback) {
            if (session.isJSON) {
                nextHandler(session, nextHandler, callback);
            } else {
                nextHandler(session, nextHandler, function (output) {
                    TopicProcess.getComments(session,function(comments) {
                        output.app.page.comments = { "comment": comments }
                        callback(output);
                    });
                });
            }
        },


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
                                            callback({  "directive":"redirect",
                                                        "location":"referer"});
                                        }
                                    } else {
                                        session.log("error saving topic" + JSON.stringify(error) +"\n"+JSON.stringify(topic.toJSON()), error);
                                        callback({"error":error});
                                    }
                                });
                            } else {
                                callback(session.getErrorHandler("cannot-remove-item"));
                            }
                        } else {
                            session.log("removeTopic: " + userId + " !=" + JSON.stringify(topic.toJSON())+ ","+ topic.get("initiator"),"error");
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
                                            callback({  "directive":"redirect",
                                                        "location":"referer"});
                                        }
                                    } else {
                                        session.error("removeComment: error saving comment" + JSON.stringify(error) +"\n"+JSON.stringify(comment.toJSON()));
                                        callback({"error":error});
                                    }
                                });
                            } else {
                                callback(session.getErrorHandler("cannot-remove-item"));
                            }
                        } else {
                            session.log("removeComment: "+userId + " !=" + JSON.stringify(comment.toJSON())+ ","+ comment.get("user_id"));
                            callback(session.getErrorHandler("cannot-remove-item"));
                        }
                        //callback ({"error":"t"+topic.initiator+"<br/>,u:"+userId});
                    });
                } else {
                    callback(session.get404());
                }
            });
        },
    };
}());

if (typeof exports !== "undefined") {
    exports.init = TopicProcess.init.bind(TopicProcess);
    exports.plugins = TopicProcess.plugins.bind(TopicProcess);
}