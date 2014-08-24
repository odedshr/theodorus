(function TagPluginClosure () {
    var io = null,
        Tag = (typeof Tag !== "undefined") ? Tag : require("./Tag").model(),
        _ = (typeof _ !== "undefined") ? _ : require("underscore"),
        TOPIC_PAGE_SIZE = 0;

    var TagPlugin = (function () {
        return {
            init: function (ioFunctions) {
                io = ioFunctions;
                TOPIC_PAGE_SIZE  = (io.config.topic_page_size) ? io.config.topic_page_size : TOPIC_PAGE_SIZE;
                return this;
            },

            getMethods: function getMethods () { return this.methods; },
            getPlugins: function getPlugins () { return this.plugins; },

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
                        TagPlugin.getTags(session,function(tags) {
                            output.app.plugins = output.app.plugins || {};
                            output.app.plugins.tags = { "tag": tags };
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
                io.db.getTopicTags(this.getTopicIdFromURL(session.url), function(tags){
                    callback(tags);
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
                        io.db.getUserTopicTagString(TagPlugin.getTopicIdFromURL(session.url), userId, function(tags){
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
                        TagPlugin.getUserTopicTags(session, function(tags){
                            output.app.plugins = output.app.plugins || {};
                            output.app.plugins.userTopicTags = { "tag": tags };
                            callback(output);
                        });
                    });
                }
            },

            updateUserTopicTags: function updateUserTopicTags (session, callback) {
                session.useUserId(function(userId) {
                    if (userId) {
                        io.db.replaceUserTopicTags(TagPlugin.getTopicIdFromURL(session.url), userId, _.uniq(session.input.tags.split(/\s?,\s?/g)), function () {
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
                io.db.getTagTopicCount(TagPlugin.getTagFromURL(session.url),function (count){
                    callback({"count":count});
                });
            },

            getTagTopics: function getTagTopics (session, callback) {
                var tag = TagPlugin.getTagFromURL(session.url),
                    page = (decodeURIComponent(session.url).replace("tags/"+tag,"").replace(/\D/g,"")*1),
                    parameters ={   "tag": tag,
                        "pageSize":TOPIC_PAGE_SIZE,
                        "page":page };

                io.db.getTopics(parameters, function(topics){
                    io.db.getTagTopicCount(tag,function (count){
                        var data = {
                            "topics": { "topic": topics },
                            "pageIndex": page,
                            "pageCount": Math.ceil(count / TOPIC_PAGE_SIZE)
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
                });
            }
        };
    }());

    TagPlugin.methods = [
        {"method":"GET",  "url":/^\/tags\/?$/,  "handler":TagPlugin.getTags.bind(TagPlugin)},
        {"method":"GET",  "url":/^\/tags\/[^#\/:\s]{3,140}\/count?\/?$/,  "handler":TagPlugin.getTagTopicCount.bind(TagPlugin)},
        {"method":"GET",  "url":/^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/,  "handler":TagPlugin.getTagTopics.bind(TagPlugin)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags(\/(\d+))?\/?$/,                            "handler":TagPlugin.getTopicTags.bind(TagPlugin)},
        {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags\/?$/,                            "handler":TagPlugin.updateUserTopicTags.bind(TagPlugin)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/tags\/my\/?$/,                            "handler":TagPlugin.getUserTopicTags.bind(TagPlugin)}
    ];

    TagPlugin.plugins = [
        {"method": "GET", "url": /^\/(:\d+\/?)?$/, "handler": TagPlugin.pGetTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TagPlugin.pGetTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TagPlugin.pGetTopicTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": TagPlugin.pGetUserTopicTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/topics\/add\/?$/, "handler": TagPlugin.pGetTags.bind(TagPlugin)},
        {"method": "GET", "url": /^\/tags\/[^#\/:\s]{3,140}(\/?:\d+)?\/?$/, "handler": TagPlugin.pGetTags.bind(TagPlugin)}
    ];

    if (typeof exports !== "undefined") {
        exports.init = TagPlugin.init.bind(TagPlugin);
        exports.methods = TagPlugin.getMethods.bind(TagPlugin);
        exports.plugins = TagPlugin.getPlugins.bind(TagPlugin);
    }
})();
// tags actions
//app.get("/tags", getMethodNotImplementedMessage);
//app.get("/tags/dictionary", getMethodNotImplementedMessage);
// get items by tag
//app.get(/^\/#[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
