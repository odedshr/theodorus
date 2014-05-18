/*
 * MySQLDbApi
 * 1. The API should translate app-specific commands to db-specific commands
 * 2. This means no object until this point should care what is the DB and the DB should not what is the app
 * */
//TODO: move TOPIC_PAGE_SIZE and RELEVANCY_PERIOD to config.json
var db = require('./MySQLDb'),
    RELEVANCY_PERIOD = 14,
    User = require("../models/User").model(),
    Credentials = require("../models/Credentials").model(),
    Topic = require("../models/Topic").model(),
    Comment = require("../models/Comment").model(),
    Tag = require("../models/Tag").model(),
    utils = require("../utilities"),
    prefix = "";


function renderWhereString (filters) {
    if (filters) {
        var where = [];
        filters.forEach(function(value) {
            where.push(value.key + " "+ value.operator + " " + value.value);
        });
        return "\n\t"+ "WHERE " + where.join(" AND ");
    }
    return "";
}

exports.init = function init (config) {
    db.init(config);
    prefix = process.env.THEODORUS_MYSQL_SCHEMA+"."+config.table_prefix;
};

exports.load = function load (itemClass, itemId, callback) {
    var item = new itemClass();
    db.getItem(item, itemId, function (itemData){
        if (itemData) {
            item.set(itemData);
            callback(item);
        } else {
            callback(false);
        }
    });
};

exports.loads = function loads (itemClass, queryOptions, callback) {
    var item = new itemClass();
    db.getItems(item, queryOptions, function (items){
        if (items) {
            callback(items);
        } else {
            callback(false);
        }
    });
};

exports.count = function count (itemClass, filters, callback) {
    var whereString = renderWhereString(filters);
    //TODO: parse filters to get WHERE filters
    var query = "SELECT count(1) as count FROM "+prefix+(new itemClass()).collection + whereString;
    db.query (query, function(result) {
        if (result) {
            callback(result[0].count);
        } else {
            callback(result);
        }
    });

}

exports.getCredentials = function(authKey,callback) { exports.load(Credentials, authKey, callback); };
exports.getUser = function(userId,callback) { exports.load(User, userId, callback); };
exports.getUserByName = function(display_name,callback) { exports.load(User, {"display_name":display_name}, callback); };
exports.getAccount = function(userId,callback) { exports.load(User.Account, userId, callback); };
exports.getTags = function(callback) { exports.loads(Tag,{}, callback); };
exports.getTopicCount = function(callback) {
    exports.count(Topic,[{"key":"status","operator":"<>","value":"'removed'"}], callback);
};
exports.getTopic = function(topicId,callback) { exports.load(Topic, topicId, callback); };
exports.getTopicRead = function(topicId,callback) { exports.load(Topic.Read, topicId, callback); };
exports.getTopics = function (parameters, callback) {
    var userId = parameters.user,
        pageSize = (parameters.pageSize) ? parameters.pageSize : 0,
        page =  (parameters.page) ? parameters.page : 1,
        limit = pageSize>0 ? ("LIMIT "+((page-1)*pageSize)+", "+pageSize ): "";
    /*  Score is based on predefined score + up to RELEVANCY_PERIOD points per day (i.e. a post from today will get
     RELEVANCY_PERIOD points) + number of follows, endorsements and reports
     * */
    var query = "SELECT u.user_id AS user_id, display_name,u.slug AS user_slug, u.picture AS picture,"+
        "\n\t"+"(t.score + GREATEST(0,"+RELEVANCY_PERIOD+"-datediff(now(),t.modified)) +"+
        "\n\t"+"\n\t"+"(t.follow+IFNULL(ut.follow,0)) + ((t.endorse+IFNULL(ut.endorse,0))*1.1) - (t.report+IFNULL(ut.report,0))) AS score,"+
        "\n\t"+"t.topic_id AS topic_id, t.slug AS slug, created, t.modified AS modified, title, tags,"+
        "\n\t"+"t.seen AS seen, t.follow AS follow, t.endorse AS endorse, t.comment AS comment, t.opinion AS opinion,"+
        "\n\t"+"t.report AS report, t.status AS status, report_status,"+
        "\n\t"+"ut.follow AS user_follow, ut.endorse AS user_endorse, ut.report AS user_report"+
        "\n\t"+"FROM "+prefix+(new Topic()).collection + " t"+
        "\n\t"+"JOIN "+prefix+(new User()).collection + " u ON t.initiator=u.user_id"+
        "\n\t"+"LEFT JOIN "+prefix+User.Topic.collection + " ut ON ut.user_id='"+(typeof userId == "undefined" ? "": userId)+"' AND t.topic_id = ut.topic_id"+
        "\n\t"+"WHERE NOT( t.status = 'removed' )"+
        "\n\t"+"GROUP BY topic_id"+
        "\n\t"+"ORDER BY score DESC, t.modified DESC" +
        "\n\t"+limit + ";";
    db.query(query,
        function (results) {
            var topics = [];
            if (results) {
                results.forEach(function (topicData) {
                    var topic = new Topic ({
                        "topic_id":topicData.topic_id,
                        "slug":topicData.slug,
                        "created":utils.getDetailedDate(topicData.created),
                        "modified":utils.getDetailedDate(topicData.modified),
                        "title":topicData.title,
                        "tags":{"tag":topicData.tags ? JSON.parse(topicData.tags) : []},
                        "endorse":topicData.endorse,
                        "follow":topicData.follow,
                        "opinion":topicData.opinion,
                        "comment":topicData.comment,
                        "report":topicData.report,
                        "user_seen":topicData.user_seen,
                        "user_endorse":topicData.user_endorse,
                        "user_follow":topicData.user_follow,
                        "user_report":topicData.user_report,
                        "status":topicData.status,
                        "report_status":topicData.report_status,
                        "initiator": new User({
                            "user_id":topicData.user_id,
                            "display_name":topicData.display_name,
                            "slug":topicData.user_slug
                        })
                    })
                    if (topicData.picture) { // if not exists, it shouldn't be an empty value
                        topic.get("initiator").set("picture",topicData.picture);
                    }
                    topics.push (topic);
                });
            }
            callback (topics);
        }
    );
};

exports.setUserTopic = function (userId, topicId,updateKey,newValue, callback) {
    var data = {"modified":(new Date()).toISOString()};
    data[updateKey] = newValue?1:0;
    db.save({"collection":User.Topic.collection,
            "where":{"topic_id":topicId,"user_id":userId},
            "set":data},
        callback);
};

exports.updateTopicCommentCount = function (topicId, callback) {
    var commentTable = prefix+ (new Comment()).collection,
        query = "UPDATE "+prefix+(new Topic()).collection +
            "\n\t"+ "SET opinion = (SELECT COUNT(DISTINCT user_id) FROM "+commentTable + " where topic_id='"+topicId+"' AND parent_id=0),"+
            "\n\t\t"+   "comment= (select count(distinct user_id) FROM "+commentTable + " where topic_id='"+topicId+"' AND NOT(parent_id=0))"+
            "\n\t"+"WHERE topic_id='"+topicId+"'";
    db.query(
        query,
        function (results) {
            callback(results[0]);
        }
    )
},

exports.getTopicStatistics = function (topicId, callback) {
    db.query(
        "SELECT SUM(endorse) AS endorse, SUM(follow) AS follow, SUM(report) AS report"+
            "\n\t"+"FROM "+prefix+User.Topic.collection + " ut"+
            "\n\t"+"WHERE topic_id = '"+topicId+"'",
        function (results) {
            callback(results[0]);
        }
    )
};

exports.getComments = function (topicId, userId, callback) {
    if (!topicId) {
        console.error("getComments with no topicId")
        topicId = 0;
    }
    var query = "SELECT u.user_id AS user_id, display_name,u.slug AS user_slug, u.picture AS picture,"+
        "\n\t"+"c.comment_id AS comment_id, c.parent_id AS parent_id, created, content,"+
        "\n\t"+"c.follow AS follow, c.endorse AS endorse, c.report AS report, report_status,"+
        "\n\t"+"uc.follow AS user_follow, uc.endorse AS user_endorse, uc.report AS user_report"+
        "\n\t"+"FROM "+prefix+(new Comment()).collection + " c"+
        "\n\t"+"JOIN "+prefix+(new User()).collection + " u ON c.user_id=u.user_id"+
        "\n\t"+"LEFT JOIN "+prefix+User.Comment.collection + " uc ON uc.user_id='"+(typeof userId == "undefined" ? "": userId)+"' AND c.comment_id = uc.comment_id"+
        "\n\t"+"WHERE c.report_status IN ('na','questioned', 'ok')"+
        "\n\t"+"AND c.topic_id = "+topicId +
        "\n\t"+"ORDER BY parent_id, comment_id;";
    db.query( query,
        function (results) {
            var opinionWriters = {},
                comments = [],
                dictionary = {}; // dictionary gives quick access to tree elements
            if (results) {
                results.forEach(function (commentData) {
                    var commentId = parseInt(commentData.comment_id),
                        parentId = parseInt(commentData.parent_id),
                        userId = parseInt(commentData.user_id),
                        comment= new Comment ({
                            "comment_id":commentId,
                            "parent_id":parentId,
                            "created":utils.getDetailedDate(commentData.created),
                            "content":commentData.content,
                            "endorse":parseInt(commentData.endorse),
                            "follow":parseInt(commentData.follow),
                            "report":parseInt(commentData.report),
                            "user_endorse":commentData.user_endorse,
                            "user_follow":commentData.user_follow,
                            "user_report":commentData.user_report,
                            "report_status":commentData.report_status,
                            "commenter": new User({
                                "user_id": userId,
                                "display_name":commentData.display_name,
                                "slug":commentData.user_slug
                            })
                        });
                    if (commentData.picture) { // if not exists, it shouldn't be an empty value
                        comment.get("commenter").set("picture",commentData.picture);
                    }
                    dictionary[commentId] = comment;
                    if (parentId==0) {             // parentId==0 => it's an opinion
                        if (!opinionWriters[userId]) {
                            opinionWriters[userId] = []
                        }
                        opinionWriters[userId].push ({"comment":comment});
                    } else { // it's a comments, add it to the parent
                        var parent = dictionary[parentId];
                        if (typeof parent.get("comments") == "undefined") {
                            parent.set("comments",[]);
                        }
                        parent.get("comments").push({"comment":comment});
                    }
                });
                /* all comments are in place but the opinions are not
                 * the latest opinion per user will contain the rest of his opinions as comments
                 * opinions with date decreasing
                 * comments with date increasing
                 * */
                for (var userId in opinionWriters) {
                    var lastOpinion = opinionWriters[userId].pop().comment,
                        newestOpinionComments = lastOpinion.get("comments");
                    if (typeof newestOpinionComments == "undefined") {
                        lastOpinion.set("comments",opinionWriters[userId].reverse());
                    } else {
                        lastOpinion.set("comments",newestOpinionComments.concat(opinionWriters[userId].reverse()));
                    }
                    comments.push (lastOpinion);
                }
            }
            callback (comments);
        }
    )
};

exports.save = function(dataObject, callback) {
    try {
        db.save(dataObject, callback);
    }catch (error) {
        console.error("error saving " + error);
        callback(false);
    }
};

exports.nullify = function nullify (dataObject, field, callback) {
    try {
        db.nullifyField(dataObject,dataObject.get(dataObject.key),field,callback);
    }catch (error) {
        console.error("error nullyfing "+field+" " + error);
        callback(false);
    }
}