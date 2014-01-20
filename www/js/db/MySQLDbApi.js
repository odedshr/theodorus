/*
 * MySQLDbApi
 * 1. The API should translate app-specific commands to db-specific commands
 * 2. This means no object until this point should care what is the DB and the DB should not what is the app
 * */
//TODO: move TOPICS_PER_PAGE and RELEVANCY_PERIOD to config.json
<<<<<<< HEAD
var db = require('./MySQLDb'),
=======
 var db = require('./MySQLDb'),
>>>>>>> 21d8b98ad519fafd92bf6a7553b01d0e3318e07f
    RELEVANCY_PERIOD = 14,
    TOPICS_PER_PAGE = 30,
    User = require("../models/User").model(),
    Credentials = require("../models/Credentials").model(),
    Topic = require("../models/Topic").model(),
    Tag = require("../models/Tag").model(),
    prefix = "";

exports.init = function (config) {
    db.init(config);
    prefix = process.env.THEODORUS_MYSQL_SCHEMA+"."+config.table_prefix;
};

exports.load = function (itemClass, itemId, callback) {
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

exports.loads = function (itemClass, queryOptions, callback) {
    var item = new itemClass();
    db.getItems(item, queryOptions, function (items){
        if (items) {
            callback(items);
        } else {
            callback(false);
        }
    });
};

exports.getCredentials = function(authKey,callback) { exports.load(Credentials, authKey, callback); };
exports.getUser = function(userId,callback) { exports.load(User, userId, callback); };
exports.getUserByName = function(display_name,callback) { exports.load(User, {"display_name":display_name}, callback); };
exports.getAccount = function(userId,callback) { exports.load(User.Account, userId, callback); };
exports.getTags = function(callback) { exports.loads(Tag,{}, callback); };
exports.getTopic = function(topicId,callback) { exports.load(Topic, topicId, callback); };
exports.getTopicRead = function(topicId,callback) { exports.load(Topic.Read, topicId, callback); };
exports.getTopics = function (parameters, callback,page) {
    var limit = page ? ("LIMIT "+((page-1)*TOPICS_PER_PAGE)+", "+TOPICS_PER_PAGE ): "",
        userId = parameters.user;
    var query = "SELECT u.user_id AS user_id, display_name,u.slug AS user_slug, u.picture AS picture,"+
<<<<<<< HEAD
        "\n\t"+"(t.score + GREATEST(0,"+RELEVANCY_PERIOD+"-count(distinct(t.modified))) +"+
        "\n\t"+"\n\t"+"(t.follow+IFNULL(ut.follow,0)) + ((t.endorse+IFNULL(ut.endorse,0))*1.1) - (t.report+IFNULL(ut.report,0))) AS score,"+
        "\n\t"+"t.topic_id AS topic_id, t.slug AS slug, created, t.modified AS modified, title, tags,"+
        "\n\t"+"t.seen AS seen, t.follow AS follow, t.endorse AS endorse, t.report AS report, t.status AS status, report_status,"+
        "\n\t"+"ut.follow AS user_follow, ut.endorse AS user_endorse, ut.report AS user_report"+
        "\n\t"+"FROM "+prefix+(new Topic()).collection + " t"+
        "\n\t"+"JOIN "+prefix+(new User()).collection + " u ON t.initiator=u.user_id"+
        "\n\t"+"LEFT JOIN "+prefix+User.Topic.collection + " ut ON ut.user_id='"+(typeof userId == "undefined" ? "": userId)+"' AND t.topic_id = ut.topic_id"+
        "\n\t"+"WHERE NOT( t.status = 'removed' )"+
        "\n\t"+"GROUP BY topic_id"+
        "\n\t"+"ORDER BY score DESC, t.modified DESC" +
        "\n\t"+limit + ";";
=======
                "\n\t"+"(t.score + GREATEST(0,"+RELEVANCY_PERIOD+"-count(distinct(t.modified))) +"+
                "\n\t"+"\n\t"+"(t.follow+IFNULL(ut.follow,0)) + ((t.endorse+IFNULL(ut.endorse,0))*1.1) - (t.report+IFNULL(ut.report,0))) AS score,"+
                "\n\t"+"t.topic_id AS topic_id, t.slug AS slug, created, t.modified AS modified, title, tags,"+
                "\n\t"+"t.seen AS seen, t.follow AS follow, t.endorse AS endorse, t.report AS report, t.status AS status, report_status,"+
                "\n\t"+"ut.follow AS user_follow, ut.endorse AS user_endorse, ut.report AS user_report"+
                "\n\t"+"FROM "+prefix+(new Topic()).collection + " t"+
                "\n\t"+"JOIN "+prefix+(new User()).collection + " u ON t.initiator=u.user_id"+
                "\n\t"+"LEFT JOIN "+prefix+User.Topic.collection + " ut ON ut.user_id='"+(typeof userId == "undefined" ? "": userId)+"' AND t.topic_id = ut.topic_id"+
                "\n\t"+"WHERE NOT( t.status = 'removed' )"+
                "\n\t"+"GROUP BY topic_id"+
                "\n\t"+"ORDER BY score DESC, t.modified DESC" +
                "\n\t"+limit + ";";
>>>>>>> 21d8b98ad519fafd92bf6a7553b01d0e3318e07f
    db.query(query,
        function (results) {
            var topics = [];
            if (results) {
                results.forEach(function (topicData) {
                    topics.push (new Topic ({
                        "topic_id":topicData.topic_id,
                        "slug":topicData.slug,
                        "created":db.getDetailedDate(topicData.created),
                        "modified":db.getDetailedDate(topicData.modified),
                        "title":topicData.title,
                        "tags":{"tag":topicData.tags ? JSON.parse(topicData.tags) : []},
                        "endorse":topicData.endorse,
                        "follow":topicData.follow,
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
                            "slug":topicData.user_slug,
                            "picture":topicData.picture
                        })
                    }));
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
exports.save = function(dataObject, callback) {
    try {
        db.save(dataObject, callback);
    }catch (error) {
        console.error("error saving " + error);
        callback(false);
    }
};