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

        getTags: function getTags (session,callback) {
            io.db.getTags (function (items) {
                if (items) {
                    callback(items);
                } else {
                    callback({"error":"error-getting-tags"});
                }
            });
        },

        getTopicTags: function getTopicTags (session,callback) {
            //TODO: allow accepting TopicSlug as input
            var topicId =  session.url.match(/topics(\/\d+)?\/?/)[0].replace(/\D/g,"");
            io.db.getTopicTags(topicId, function(tags){
                callback(tags);
            });
        },

        getUserTopicTags: function getUserTopicTags (session,callback) {
            //TODO: allow accepting TopicSlug as input
            var topicId =session.url.match(/topics(\/\d+)?\/?/)[0].replace(/\D/g,"");
            session.useUserId(function(userId) {
                if (userId) {
                    io.db.getUserTopicTagString(topicId, userId, function(tags){
                        callback(tags);
                    });
                } else {
                    callback("");
                }
            });
        },

        updateUserTopicTags: function updateUserTopicTags (session, callback) {
            var topicId =session.url.match(/topics(\/\d+)?\/?/)[0].replace(/\D/g,"");
            session.useUserId(function(userId) {
                if (userId) {
                    io.db.replaceUserTopicTags(topicId, userId, _.uniq(session.input.tags.split(/\s?,\s?/g)), function () {
                        session.res.writeHead(301,{location: session.req.headers['referer']});
                        callback({});
                    });
                } else {
                    callback(session.getErrorHandler("no-permission"));
                }
            })
        },

        getTagTopicCount: function getTagTopics (session, callback) {
            var url = decodeURIComponent(session.url),
                tagRegEx = url.match(/tags\/([^:\/ ]+)\/?(:\d)?/),
                tag = tagRegEx[1];

            io.db.getTagTopicCount(tag,function (count){
                callback({"count":count});
            });
        },

        getTagTopics: function getTagTopics (session, callback) {
            var url = decodeURIComponent(session.url),
                tagRegEx = url.match(/tags\/([^:\/ ]+)\/?(:\d)?/),
                tag = tagRegEx[1],
                page = (url.replace("tags/"+tag,"").replace(/\D/g,"")*1),
                isJSONOriginal = session.isJSON,
                tasks = [
                    {"method":"get","url":"/tags/"+tag+"/count","outputName":"topicCount"},
                    {"method":"get","url":"/me","outputName":"me"},
                    {"method":"get","url":"/tags","outputName":"tags"}
                ],
                parameters ={   "tag": tag,
                    "pageSize":TOPIC_PAGE_SIZE,
                    "page":page },
                taskCount = tasks.length,
                taskOutput = {},
                taskCompleted = function taskCompleted() {
                    if (!(--taskCount)) {
                        session.isJSON = isJSONOriginal;
                        callback({
                            "app":{
                                "mode": io.getTheodorusMode(),
                                "page": {
                                    "@type":"feed",
                                    "tag": tag,
                                    "topics": { "topic": taskOutput.topics },
                                    "pageIndex": page,
                                    "pageCount": Math.ceil(taskOutput.topicCount.count / TOPIC_PAGE_SIZE),
                                    "tags": { "tag": taskOutput.tags },
                                    "user":taskOutput.me
                                }
                            }
                        });
                    }
                };

            io.db.getTopics(parameters, function(topics){
                taskOutput.topics = topics;
                session.isJSON = true;
                tasks.forEach(function (task) {
                    (io.getHandler(task.method,task.url))(session, function (output) {
                        taskOutput[task.outputName] = output;
                        taskCompleted();
                    } );
                });
            });
        }
    };
}());

if (typeof exports !== "undefined") {
    exports.init = TagProcess.init.bind(TagProcess);
}

// tags actions
//app.get("/tags", getMethodNotImplementedMessage);
//app.get("/tags/dictionary", getMethodNotImplementedMessage);
// get items by tag
//app.get(/^\/#[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
