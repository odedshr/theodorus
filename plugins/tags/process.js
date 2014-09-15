(function TagPluginClosure () {
    var io = null,
        TagModels = (typeof TagModels !== "undefined") ? TagModels : require("./Tag");
        Tag = TagModels.model(),
        _ = (typeof _ !== "undefined") ? _ : require("underscore"),
        TOPIC_PAGE_SIZE = 0,
        NUMBER_OF_COLORS = 20;

    var TagPlugin = (function () {
        return {
            init: function (ioFunctions) {
                io = ioFunctions;
                TOPIC_PAGE_SIZE  = (io.config.topic_page_size) ? io.config.topic_page_size : TOPIC_PAGE_SIZE;

                var originalGetTopics = io.db.getTopics;
                io.db.getTopics = function (parameters, callback) {
                    originalGetTopics(parameters,function (output) { return TagPlugin.getTopicsWithTags(output,callback); })
                }
                io.db.verifyExistance(Tag, function(){});
                io.db.verifyExistance(Tag.TopicTags, function(){});
                return this.methods;
            },

            getTags: function getTags (session,callback) {
                try{
                    TagPlugin.getTopicTagsByKey(undefined,callback);
                } catch (error) {
                    callback(session.getErrorHandler(error));
                }
            },

            pGetTags: function pGetTags (session, nextHandler, callback) {
                if (session.isJSON) {
                    nextHandler(session, nextHandler, callback);
                } else {
                    nextHandler(session, nextHandler, function (output) {
                        TagPlugin.getTags(session,function(tags) {
                            output.app.plugins = output.app.plugins || {};
                            output.app.plugins.tags = { "tag": tags };
                            callback(output);
                        });
                    });
                }

            },

            getTopicTags: function getTopicTags (session,callback) {
                io.db.useTopicIdFromURL(session.url, function useTopicId(topicId){
                    try{
                        TagPlugin.getTopicTagsByKey({"topic_id":topicId},callback);
                    } catch (error) {
                        callback(session.getErrorHandler(error,"topicId",topicId));
                    }
                });
            },

            getTopicTagsByKey: function getTopicTagsByKey (key,callback) {
                io.db.orm([Tag],function (models) {
                    models.tags.aggregate(["tag"],key).count("tag").groupBy("tag").get(function(err,tags){
                        if (err) {
                            throw err;
                        }
                        tags.forEach(function (tagInfo) {
                            tagInfo.count = tagInfo.count_tag;
                            delete tagInfo.count_tag;
                        });
                        tags.sort(function(a,b) {
                            var aCount = a.count,
                                bCount = b.count;
                            return (aCount > bCount) ? -1 : ((aCount < bCount) ? 1 : ((a.tag < b.tag) ? -1 : 1));
                        });
                        callback(TagPlugin.getColoredTags(tags));
                    });
                });
            },

            pGetTopicTags: function pGetTopicTags (session, nextHandler, callback) {
                if (session.isJSON) {
                    nextHandler(session, nextHandler, callback);
                } else {
                    nextHandler(session, nextHandler, function (output) {
                        TagPlugin.getTopicTags(session, function(tags){
                            output.app.plugins = output.app.plugins || {};
                            output.app.plugins.topicTags = { "tag": tags };
                            callback(output);
                        });
                    });
                }

            },

            getUserTopicTags: function getUserTopicTags (session,callback) {
                session.useUserId(function(userId) {
                    if (userId) {
                        io.db.useTopicIdFromURL(session.url, function useTopicId(topicId){
                            io.db.orm([Tag],function (models) {
                                models.tags.find({"topic_id":topicId, "user_id":userId}, function(err,results){
                                    if (err) {
                                        callback(session.getErrorHandler(err));
                                    } else {
                                        var tags = [];
                                        results.forEach(function extractTag (record) {
                                            tags.push(record.tag);
                                        })
                                        tags.sort();
                                        callback(tags.join(", "));
                                    }
                                });
                            });
                        });
                    } else {
                        callback(session.getErrorHandler("no-permissions"));
                    }
                });
            },

            pGetUserTopicTags: function pGetUserTopicTags (session, nextHandler, callback) {
                if (session.isJSON) {
                    nextHandler(session, nextHandler, callback);
                } else {
                    nextHandler(session, nextHandler, function (output) {
                        TagPlugin.getUserTopicTags(session, function(tags){
                            output.app.plugins = output.app.plugins || {};
                            output.app.plugins.userTopicTags = { "tag": tags };
                            callback(output);
                        });
                    });
                }
            },

            updateUserTopicTags: function updateUserTopicTags (session, callback) {
                io.db.useTopicIdFromURL(session.url, function usingTopicId(topicId) {
                    session.useUserId(function(userId) {
                        if (userId) {
                            var chain = [],
                                chainCallback = function () {
                                    if (chain.length) {
                                        (chain.pop())();
                                    }
                                },
                                newTags = _.uniq(session.input.tags.split(/\s?,\s?/g));
                            io.db.orm([Tag,Tag.TopicTags], function (models) {
                                models.tags.find({"user_id":userId, "topic_id":topicId }, function dropOldUserTopicTags (err,output) {
                                    output.forEach(function addDeleteTagToChain (userTopicTag) {
                                        chain.push (function deleteTag() {
                                            userTopicTag.remove(chainCallback)
                                        });
                                    });

                                    newTags.forEach(function addAddTagToChain (tag) {
                                       chain.push (function addUserTopicTag() {
                                           models.tags.create({"user_id":userId, "topic_id":topicId, "tag": tag }, chainCallback);
                                       });
                                    });

                                    chain.push (function updateTopicTags() {
                                        TagPlugin.getTopicTagsByKey({ "topic_id": topicId }, function writeTopicTags(tags) {
                                            models.topic_tags.get(topicId,function(err,topicTags) {
                                                if (err) {
                                                    if (err.literalCode == "NOT_FOUND") {
                                                        models.topic_tags.create({"topic_id": topicId, "tags": JSON.stringify(tags)},chainCallback );
                                                    } else {
                                                        throw  err;
                                                    }
                                                } else {
                                                    topicTags.tags = JSON.stringify(tags);
                                                    topicTags.save( chainCallback );
                                                }
                                            });
                                        });
                                    });

                                    chain.push (function finishChain() {
                                        callback({  "directive":"redirect", "location":"referer"});
                                    });

                                    chain.reverse();
                                    (chain.pop())();
                                });
                            });
                        } else {
                            callback(session.getErrorHandler("no-permission"));
                        }
                    })
                });
            },

            getTagFromURL: function getTagFromURL (url) {
                var tagRegEx = decodeURIComponent(url).match(/tags\/([^:\/ ]+)\/?(:\d)?/);
                return tagRegEx[1];
            },

            getTagTopicCount: function getTagTopics (session, callback) {
                io.db.orm([Tag],function (models) {
                    models.tags.count({tag:TagPlugin.getTagFromURL(session.url)}, function(err,count){
                        callback({"count":count});
                    });
                });
            },

            getTagTopics: function getTagTopics (session, callback) {
                var tag = TagPlugin.getTagFromURL(session.url),
                    page = (decodeURIComponent(session.url).replace("tags/"+tag,"").replace(/\D/g,"")*1),
                    firstItem = page*TOPIC_PAGE_SIZE,
                    lastItem = firstItem+TOPIC_PAGE_SIZE;

                io.db.orm([Tag],function processUserTopicTags (models) {
                    models.tags.aggregate(["topic_id"],{ "tag": tag }).count("topic_id").groupBy("topic_id").get(function(err,userTopicTags){
                        if (err) {
                            callback(session.getErrorHandler(error));
                        } else {
                            var topicCount = userTopicTags.length,
                                stats = {},
                                topicIds = [];
                            topicIds.sort(function(a,b) {
                                var aCount = a.count_topic_id,
                                    bCount = b.count_topic_id;
                                return (aCount > bCount) ? -1 : ((aCount < bCount) ? 1 : ((a.tag < b.tag) ? -1 : 1));
                            });
                            for (var i=firstItem; i<Math.min(topicCount, lastItem);i++) {
                                var topicIdInfo = userTopicTags[i],
                                    topicId = topicIdInfo.topic_id;
                                stats[topicId] = topicIdInfo.count_topic_id;
                                topicIds.push (topicId)
                            }
                            io.db.getTopics({"whitelist":topicIds}, function (topics) {
                                var data = {
                                    "topics": { "topic": topics },
                                    "pageIndex": page,
                                    "pageCount": Math.ceil(topicCount / TOPIC_PAGE_SIZE)
                                };
                                callback(session.isJSON ? _.extend(data, { "tag": tag }) : {
                                    "app":{
                                        "page": {},
                                        "plugins": {
                                            "tagTopics": {
                                                "tag": tag,
                                                "page" : _.extend(data,{
                                                    "@type":"feed"
                                                })
                                            }
                                        }
                                    }});
                            });
                        }
                    });
                });
            },

            getTopicsWithTags: function getTopicsWithTags (topics, callback) {
                var topicDictionary = {},
                    topicIds = [];
                topics.forEach(function loopThroughTopics (topic) {
                    var topicId = topic.get("topic_id");
                    topicIds.push({"topic_id":topicId });
                    topicDictionary[topicId] = topic;
                });
                io.db.orm([Tag.TopicTags],function processTopicTagJSONSs (models) {
                    models.topic_tags.find({or: topicIds},function (err,output) { //or : topicIds
                        if (err) {
                            io.log("processTopicTags:" + JSON.stringify(err), "error");
                        } else {
                            output.forEach(function(record) {
                                topicDictionary[record.topic_id].set("tags",{"tag":TagPlugin.getColoredTags(record.tags)});
                            })
                        }
                        callback(topics);
                    });
                });
            },

            getColoredTags : function getColoredTags (tags) {
                var colorDic = {};
                tags.forEach(function (tag) {
                    var text = tag.tag;
                    if (!colorDic[text]) {
                        var acc = 0;
                        for (var i=0;i<text.length;i++) {
                            acc += text.charCodeAt(i)
                        }
                        colorDic[text] = (acc % NUMBER_OF_COLORS);
                    }
                    tag.color = colorDic[text];
                });
                return tags;
            }
        };
    }());

    TagPlugin.methods = [
        {"method":"GET", "url":/^\/tags\/?$/,  "handler":TagPlugin.getTags.bind(TagPlugin)},
        {"method":"GET", "url":/^\/tags\/[^#\/:\s]{3,140}\/count?\/?$/,  "handler":TagPlugin.getTagTopicCount.bind(TagPlugin)},
        {"method":"GET", "url":/^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/,  "handler":TagPlugin.getTagTopics.bind(TagPlugin)},
        {"method":"GET", "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags(\/(\d+))?\/?$/, "handler":TagPlugin.getTopicTags.bind(TagPlugin)},
        {"method":"POST", "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags\/?$/, "handler":TagPlugin.updateUserTopicTags.bind(TagPlugin)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags\/my\/?$/, "handler":TagPlugin.getUserTopicTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(:\d+\/?)?$/, "pipe": TagPlugin.pGetTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "pipe": TagPlugin.pGetTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "pipe": TagPlugin.pGetTopicTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "pipe": TagPlugin.pGetUserTopicTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/topics\/add\/?$/, "pipe": TagPlugin.pGetTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/, "pipe": TagPlugin.pGetTags.bind(TagPlugin)}
    ];

    if (typeof exports !== "undefined") {
        exports.init = TagPlugin.init.bind(TagPlugin);
    }
})();
// tags actions
//app.get("/tags", getMethodNotImplementedMessage);
//app.get("/tags/dictionary", getMethodNotImplementedMessage);
// get items by tag
//app.get(/^\/#[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
