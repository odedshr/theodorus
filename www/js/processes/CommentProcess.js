(function CommentProcessClosure () {
    var io = null,
        Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
        Comment = (typeof Comment !== "undefined") ? Comment : require("../models/Comment").model(),
        _ = (typeof _ !== "undefined") ? _ : require("underscore");

    var CommentProcess = (function () {
        return {
            init: function (ioFunctions) {
                io = ioFunctions;
            },

            getMethods: function getMethods () { return this.methods; },
            getPlugins: function getPlugins () { return this.plugins; },

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
                    CommentProcess.getTopic(session, function topicLoaded(pageInfo) {
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

            getComments: function getComments (session,callback) {
                var topicKey = this.getTopicIndexByUrl(session.url);
                session.useUserId(function (userId) {
                    io.db.getComments(topicKey.topic_id,userId, function (comments) {
                        callback(comments);
                    });
                });
            },

            pGetComments: function getComments (session, nextHandler, callback) {
                var self = this;

                if (session.isJSON) {
                    nextHandler(session, nextHandler, callback);
                } else {
                    nextHandler(session, nextHandler, function (output) {
                        self.getComments(session,function(comments) {
                            output.app.page.comments = { "comment": comments }
                            callback(output);
                        });
                    });
                }
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
            }
        };
    }());

    CommentProcess.methods =  [
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/?$/,            "handler":CommentProcess.getComments.bind(CommentProcess)},
        {"method":"POST",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(\d+\/)?comment\/?$/,    "handler":CommentProcess.addComment.bind(CommentProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/?$/,         "handler":CommentProcess.getComment.bind(CommentProcess)},
        {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/?$/,         "handler":CommentProcess.removeComment.bind(CommentProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/comments\/(\d+)\/remove\/?$/,    "handler":CommentProcess.removeComment.bind(CommentProcess)},
    ];

    CommentProcess.plugins = [
        {"method": "GET", "url": /^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/, "handler": CommentProcess.pGetComments.bind(CommentProcess)},
    ];

    if (typeof exports !== "undefined") {
        exports.init = CommentProcess.init.bind(CommentProcess);
        exports.methods = CommentProcess.getMethods.bind(CommentProcess);
        exports.plugins = CommentProcess.getPlugins.bind(CommentProcess);
    }
})();