(function TopicProcessClosure () {
    var io = null,
        Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
        Comment = (typeof Comment !== "undefined") ? Comment : require("../models/Comment").model(),
        User = (typeof User !== "undefined") ? User : require("../models/User").model(),
        _ = (typeof _ !== "undefined") ? _ : require("underscore"),
        TOPIC_PAGE_SIZE = 0,
        RELEVANCY_PERIOD = 0;

    var TopicProcess = (function () {
        return {
            init: function (ioFunctions) {
                io = ioFunctions;
                var topicPageSize = io.vars("topic_page_size"),
                    relevancyPeriod = io.vars("relevancy_period");

                TOPIC_PAGE_SIZE  = (topicPageSize) ? topicPageSize : TOPIC_PAGE_SIZE;
                RELEVANCY_PERIOD = (relevancyPeriod) ? relevancyPeriod : RELEVANCY_PERIOD;
                return this.methods;
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
                        callback(session.getPermissionDeniedError());
                    }
                });
            },

            getTopics: function (session,callback) {
                session.useUserId(function(userId) {
                    var page = Math.max(1,parseInt(session.url.replace(/\D/g,"")*1)),
                        parameters = {
                            "user" : userId,
                            "pageSize" : TOPIC_PAGE_SIZE,
                            "page": page,
                            "relevancyPeriod" : RELEVANCY_PERIOD
                        };

                    io.db.getTopics (parameters,function (topics) {
                        if (topics) {
                            io.db.getTopicCount(function(count){
                                var output = {
                                    "topics": { "topic": topics },
                                    "pageIndex": page,
                                    "pageCount": Math.ceil(count / TOPIC_PAGE_SIZE)
                                };
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
                session.useUserAccount(function(user) {
                    if (user && user.can("suggest")) {
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
                                    //TODO: validate input + saftify!!!
                                    var userId = user.get("user_id"),
                                        createDate = (new Date()).toISOString(),
                                        topic = new Topic({
                                            "created": createDate,
                                            "modified":createDate,
                                            "user_id":userId,
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
                                }
                            });
                        }
                    } else {
                        callback(session.getPermissionDeniedError());
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
                    });
                } else {
                    callback({"result": "slug-is-invalid"});
                }
            },

            getTopic: function (session,callback) {
                io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                    io.db.getTopic(topicId, function (topic){
                        if (topic) {
                            io.db.getTopicRead(topicId, function(topicRead){
                                topic.set("read",topicRead ? {"section":topicRead.get("content")} : "");

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
                            callback(session.getNotFoundError("topic",topicId));
                        }
                    });
                });
            },

            getTopicForRead: function getTopicForRead (session,callback) {
                io.db.useTopicIdFromURL(session.url, function editEithTopicId (topicId) {
                    io.db.getTopicRead(topicId, function (topicRead) {
                        callback(topicRead ? topicRead : "");
                    });
                });
            },

            setUserTopicAttribute :function setUserTopicAttribute (session,callback,attribute,value) {
                session.useUserAccount(function(user) {
                    if (user.can(attribute)) {
                        io.db.useTopicIdFromURL(session.url, function editWithTopicId (topicId) {
                            io.db.getTopic(topicId, function (topic){
                                if (topic) {
                                    var userId = user.get("user_id");
                                    io.db.setUserTopic(userId,topicId,attribute,value,function (output){
                                        if (!output) {
                                            callback(session.getInternalServerError("save-user-topic",JSON.stringify({"user":userId,"topic":topicId,"attribute":attribute,"value":value})));
                                        } else {
                                            io.db.getTopicStatistics(topicId, function (statistics) {
                                                var value = statistics[attribute],
                                                    saveTopic = function () {
                                                        io.db.save(topic, function(topicSaveResult){
                                                            callback (
                                                                topicSaveResult.error ?
                                                                    topicSaveResult :
                                                                    (session.isJSON ?
                                                                    {
                                                                        "key":attribute,
                                                                        "value":(value ? value : 0)
                                                                    }: {  "directive":"redirect",
                                                                          "location":"referer"})
                                                            );
                                                        });
                                                    };

                                                topic.set(attribute,(value ? value : 0));
                                                //TODO: topic.score on user feedback is calculated real-time
                                                //TODO: update user_topic.score
                                                //TODO: update user.score

                                                if (attribute=="endorse") {
                                                    io.db.getUserCount(function (totalUserCount) {
                                                        var endorsedPercentage = (value*100/totalUserCount),
                                                            status = topic.get("status"),
                                                            statusCap = io.vars("topic_status_caps")[status];
                                                        if ( endorsedPercentage > statusCap ) {
                                                            topic.incrementStatus();
                                                        }
                                                        saveTopic();
                                                    });
                                                } else {
                                                    saveTopic();
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    callback(session.getErrorHandler("topic-not-found"));
                                }
                            });
                        });
                    } else {
                        callback(session.getPermissionDeniedError(attribute));
                    }
                });
            },

            follow: function follow     (session,callback) { this.setUserTopicAttribute(session,callback,"follow",session.url.indexOf("/follow")!=-1); },
            endorse: function endorse   (session,callback) { this.setUserTopicAttribute(session,callback,"endorse",session.url.indexOf("/endorse")!=-1); },
            report: function report     (session,callback) { this.setUserTopicAttribute(session,callback,"report",session.url.indexOf("/report")!=-1); },

            invite: function invite     (session,callback) { callback({"error":"method-not-implemented"});}, //  case "post/topic/##/invite/[person]": // {invite-message}

            removeTopic: function removeTopic (session, callback) {
                io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                    io.db.getTopic(topicId, function (topic){
                        if (topic) {
                            session.useUserId(function(userId) {
                                if (userId == topic.get("user_id")) {
                                    if (topic.get("endorse") === 0 && topic.get("follow") === 0 && topic.get("comment") === 0) {
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
                                    session.log("removeTopic: " + userId + " !=" + JSON.stringify(topic.toJSON())+ ","+ topic.get("user_id"),"error");
                                    callback(session.getErrorHandler("cannot-remove-item"));
                                }
                                //callback ({"error":"t"+topic.initiator+"<br/>,u:"+userId});
                            });
                        } else {
                            callback(session.getNotFoundError("topic",topicId));
                        }
                    });
                });
            }
        };
    }());

    TopicProcess.methods =  [
        {"method":"GET",  "url":[
            /^\/(:\d+\/?)?$/,
            /^\/topics(:\d+)?\/?$/
        ],"handler":TopicProcess.getTopics.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/topics\/count\/?$/,                                     "handler":TopicProcess.getTopicCount.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/topics\/add\/?$/,                                       "handler":TopicProcess.getAddTopicPage.bind(TopicProcess)},
        {"method":"POST", "url":/^\/topics\/?$/,                                            "handler":TopicProcess.addTopic.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/\*[a-zA-Z0-9_-]{3,140}\/exists\/?$/,                    "handler":TopicProcess.isExists.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,              "handler":TopicProcess.getTopic.bind(TopicProcess)},
        {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,           "handler":TopicProcess.removeTopic.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/remove\/?$/,      "handler":TopicProcess.removeTopic.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/read\/?$/,        "handler":TopicProcess.getTopicForRead.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?follow\/?$/,         "handler":TopicProcess.follow.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?report\/?$/,         "handler":TopicProcess.report.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?endorse\/?$/,        "handler":TopicProcess.endorse.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/invite\/@[a-zA-Z0-9_-]{3,15}\/?$/,    "handler":TopicProcess.invite.bind(TopicProcess)},
    ];

    if (typeof exports !== "undefined") {
        exports.init = TopicProcess.init.bind(TopicProcess);
    }
})();