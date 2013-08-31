var db = require('./MySQLDb'),
    User = require("../models/User").model(),
    Credentials = require("../models/Credentials").model(),
    Topic = require("../models/Topic").model(),
    prefix = "";

exports.init = function (config) {
    db.init(config);
    prefix = config.mysql_schema+"."+config.table_prefix;
}

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
}

exports.loads = function (itemClass, queryOptions, callback) {
    var item = new itemClass();
    db.getItems(item, queryOptions, function (items){
        if (items) {
            callback(items);
        } else {
            callback(false);
        }
    });
}

exports.getCredentials = function(authKey,callback) { exports.load(Credentials, authKey, callback); }
exports.getUser = function(userId,callback) { exports.load(User, userId, callback); }
exports.getUserByName = function(display_name,callback) { exports.load(User, {"display_name":display_name}, callback); }
exports.getAccount = function(userId,callback) { exports.load(User.Account, userId, callback); }
exports.getTopic = function(topicId,callback) { exports.load(Topic, topicId, callback); }

exports.getTopics = function (callback) {
    db.query(
        "SELECT topic_id, t.slug AS slug, created, modified, title, tags, endorsements, follows,reports, t.status AS status,report_status,"+
        "\n\t"+"user_id,display_name,u.slug AS user_slug, picture"+
        "\n\t"+"FROM "+prefix+(new Topic()).collection + " t"+
        "\n\t"+"JOIN "+prefix+(new User()).collection + " u where t.initiator=u.user_id"+
        "\n\t"+"ORDER BY t.score DESC, modified DESC;",
        function (results) {
            var topics = [];
            if (results) {
                results.forEach(function (topicData) {
                    topics.push (new Topic ({
                        "topic_id":topicData.topic_id,
                        "slug":topicData.slug,
                        "created":topicData.created,
                        "modified":topicData.modified,
                        "title":topicData.title,
                        "tags":topicData.tags,
                        "endorsements":topicData.endorsements,
                        "follows":topicData.follows,
                        "reports":topicData.reports,
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
}

exports.save = function(dataObject, callback) {
    db.save(dataObject, callback);
}