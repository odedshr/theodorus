var io = null,
    Tag = (typeof Tag !== "undefined") ? Tag : require("../models/Tag").model(),
    _ = (typeof _ !== "undefined") ? _ : require("underscore"),
    TOPIC_PAGE_SIZE = 0;

var TagProcess = (function () {
    return {
        init: function (ioFunctions) {
            io = ioFunctions;
            TOPIC_PAGE_SIZE  = (io.config.topic_page_size) ? io.config.topic_page_size : TOPIC_PAGE_SIZE;

            return [
                {"method":"GET",  "url":/^\/tags\/?$/,  "handler":TagProcess.getTags.bind(TagProcess)},
                {"method":"GET",  "url":/^\/tags\/[^#\/:\s]{3,140}\/count?\/?$/,  "handler":TagProcess.getTagTopicCount.bind(TagProcess)},
                {"method":"GET",  "url":/^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/,  "handler":TagProcess.getTagTopics.bind(TagProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags(\/(\d+))?\/?$/,                            "handler":TagProcess.getTopicTags.bind(TagProcess)},
                {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags\/?$/,                            "handler":TagProcess.updateUserTopicTags.bind(TagProcess)},
                {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags\/my\/?$/,                            "handler":TagProcess.getUserTopicTags.bind(TagProcess)}
            ];
        },

        plugins: function plugins () {
            return [
                {"method": "GET", "url": /^\/(:\d+\/?)?$/, "handler": TagProcess.pGetTags.bind(TagProcess)},
                {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TagProcess.pGetTags.bind(TagProcess)},
                {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TagProcess.pGetTopicTags.bind(TagProcess)},
                {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TagProcess.pGetUserTopicTags.bind(TagProcess)},
                {"method": "GET", "url": /^\/topics\/add\/?$/, "handler": TagProcess.pGetTags.bind(TagProcess)},
                {"method": "GET", "url": /^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/, "handler": TagProcess.pGetTags.bind(TagProcess)}
            ];
        },

        getTags: function getTags (session,callback) {
            io.db.getTags (function (items) {
                if (items) {
                    callback(items);
                } else {
                    callback({"error":"error-getting-tags"});
                }
            });
        },

        pGetTags: function pGetTags (session, nextHandler, callback) {
            if (session.isJSON) {
                nextHandler(session, nextHandler, callback);
            } else {
                nextHandler(session, nextHandler, function (output) {
                    TagProcess.getTags(session,function(tags) {
                        output.app.page.tags = { "tag": tags };
                        callback(output);
                    });
                });
            }

        },

        getTopicIdFromURL: function getTopicIdFromURL (url) {
            //TODO: allow accepting TopicSlug as input
            return url.match(/topics(\/\d+)?\/?/)[0].replace(/\D/g,"");
        },

        getTopicTags: function getTopicTags (session,callback) {
            io.db.getTopicTags(TagProcess.getTopicIdFromURL(session.url), function(tags){
                callback(tags);
            });
        },

        pGetTopicTags: function pGetTopicTags (session, nextHandler, callback) {
            if (session.isJSON) {
                nextHandler(session, nextHandler, callback);
            } else {
                nextHandler(session, nextHandler, function (output) {
                    TagProcess.getTopicTags(session, function(tags){
                        output.app.page.topic.tags = { "tag": tags };
                        callback(output);
                    });
                });
            }

        },

        getUserTopicTags: function getUserTopicTags (session,callback) {
            session.useUserId(function(userId) {
                if (userId) {
                    io.db.getUserTopicTagString(TagProcess.getTopicIdFromURL(session.url), userId, function(tags){
                        callback(tags);
                    });
                } else {
                    callback({"error":"no-permissions"});
                }
            });
        },

        pGetUserTopicTags: function pGetUserTopicTags (session, nextHandler, callback) {
            if (session.isJSON) {
                nextHandler(session, nextHandler, callback);
            } else {
                nextHandler(session, nextHandler, function (output) {
                    TagProcess.getUserTopicTags(session, function(tags){
                        output.app.page.userTopicTags = { "tag": tags };
                        callback(output);
                    });
                });
            }
        },

        updateUserTopicTags: function updateUserTopicTags (session, callback) {
            session.useUserId(function(userId) {
                if (userId) {
                    io.db.replaceUserTopicTags(TagProcess.getTopicIdFromURL(session.url), userId, _.uniq(session.input.tags.split(/\s?,\s?/g)), function () {
                        callback({  "directive":"redirect",
                                    "location":"referer"});
                    });
                } else {
                    callback(session.getErrorHandler("no-permission"));
                }
            })
        },

        getTagFromURL: function getTagFromURL (url) {
            var tagRegEx = decodeURIComponent(url).match(/tags\/([^:\/ ]+)\/?(:\d)?/);
            return tagRegEx[1];
        },

        getTagTopicCount: function getTagTopics (session, callback) {
            io.db.getTagTopicCount(TagProcess.getTagFromURL(session.url),function (count){
                callback({"count":count});
            });
        },

        getTagTopics: function getTagTopics (session, callback) {
            var tag = TagProcess.getTagFromURL(session.url),
                page = (decodeURIComponent(session.url).replace("tags/"+tag,"").replace(/\D/g,"")*1),
                parameters ={   "tag": tag,
                    "pageSize":TOPIC_PAGE_SIZE,
                    "page":page };

            io.db.getTopics(parameters, function(topics){
                io.db.getTagTopicCount(tag,function (count){
                    var data = {
                        "tag": tag,
                        "topics": { "topic": topics },
                        "pageIndex": page,
                        "pageCount": Math.ceil(count / TOPIC_PAGE_SIZE)
                    };
                    callback(session.isJSON ? data : {
                        "app":{
                            "page": _.extend(data,{
                                "@type":"feed"
                            })
                        }});
                });
            });
        }
    };
}());

if (typeof exports !== "undefined") {
    exports.init = TagProcess.init.bind(TagProcess);
    exports.plugins = TagProcess.plugins.bind(TagProcess);
}

// tags actions
//app.get("/tags", getMethodNotImplementedMessage);
//app.get("/tags/dictionary", getMethodNotImplementedMessage);
// get items by tag
//app.get(/^\/#[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
