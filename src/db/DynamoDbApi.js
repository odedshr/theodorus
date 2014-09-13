var db = require('./DynamoDb'),
    User = require("../models/User").model(),
    Credentials = require("../models/Credentials").model(),
    Topic = require("../models/Topic").model();

exports.init = function (config) {
    db.init(config);
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

exports.getCredentials = function(authKey,callback) { exports.load(Credentials, authKey, callback); };
exports.getUser = function(userId,callback) { exports.load(User, userId, callback); };
exports.getAccount = function(userId,callback) { exports.load(User.Account, userId, callback); };
exports.getTopic = function(topicId,callback) { exports.load(Topic, topicId, callback); };

exports.save = function(dataObject, callback) {
    db.save(dataObject, callback);
};
