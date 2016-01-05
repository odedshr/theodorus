;(function communityRoutesEnclosure() {
    'use strict';
    var tryCatch = require('../helpers/tryCatch.js');
    var Encryption = require('../helpers/Encryption.js');
    var validators = require('../helpers/validators.js');
    var chain = require('../helpers/chain.js');

    function add (authUser, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join,  db, callback) {
        var community = db.community.model.getNew(undefined, authUser.id, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join);
        validateValues(community, valuesValidated.bind(null, db, callback), callback);
    }

    function update (authUser, communityId, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join,  db, callback) {
        var community = db.community.model.getNew(Encryption.unmask(communityId), authUser.id, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join);
        validateValues(community, valuesValidated.bind(null, db, callback), callback);
    }

    function validateValues (community, onSuccess, onError) {
        if (validators.isValidCommunityName(community.name)) {
            //TODO: validate founderId == communityFounderId
            onSuccess(community);
        } else {
            onError (new Error('invalid-name'));
        }
    }

    function valuesValidated (db,callback, community) {
        if (community.id !== undefined && +community.id > 0) {
            //TODO: validate founderId == communityFoudnerId
            db.community.get(community.id, editValues.bind(null, db, callback, community));
        } else if (community.founderId !== undefined && +community.founderId > 0) {
            var dCommunity = db.community.model.getNew();
            editValues(db, callback, community, undefined, dCommunity)
        } else {
            callback (new Error('community-must-have-founder'));
        }
    }

    function editValues(db, callback, jCommunity,error,dCommunity) {
        tryCatch( function tryCatchEditValues () {
            if (error) {
                callback (new Error(error));
            } else if (dCommunity) {
                setValues(dCommunity, jCommunity);
                if (dCommunity.id) {
                    dCommunity.save(chain.onSaved.bind(null, callback));
                } else {
                    db.community.create(dCommunity, chain.onSaved.bind(null, callback));
                }

            } else {
                callback (new Error(409));
            }
        }, function (err) {
            callback(err);
        });
    }

    function setValues (dCommunity, jCommunity) {
        if (jCommunity.founderId !== jCommunity.undefined) {
            dCommunity.founderId = jCommunity.founderId;
        }
        if (jCommunity.name !== jCommunity.undefined) {
            dCommunity.name = jCommunity.name;
        }
        if (jCommunity.status !== jCommunity.undefined) {
            dCommunity.status = jCommunity.status;
        }
        if (jCommunity.description !== jCommunity.undefined) {
            dCommunity.description = jCommunity.description;
        }
        if (jCommunity.topicLength !== jCommunity.undefined) {
            dCommunity.topicLength = jCommunity.topicLength;
        }
        if (jCommunity.opinionLength !== jCommunity.undefined) {
            dCommunity.opinionLength = jCommunity.opinionLength;
        }
        if (jCommunity.commentLength !== jCommunity.undefined) {
            dCommunity.commentLength = jCommunity.commentLength;
        }
        if (jCommunity.minAge !== jCommunity.undefined) {
            dCommunity.minAge = jCommunity.minAge;
        }
        if (jCommunity.maxAge !== jCommunity.undefined) {
            dCommunity.maxAge = jCommunity.maxAge;
        }
        if (jCommunity.gender !== jCommunity.undefined) {
            dCommunity.gender = jCommunity.gender;
        }
        if (jCommunity.join !== jCommunity.undefined) {
            dCommunity.join = jCommunity.join;
        }
        if (jCommunity.modified !== jCommunity.undefined) {
            dCommunity.modified = jCommunity.modified;
        }
    }

    function get (communityId, db, callback) {
        db.community.get(Encryption.unmask(communityId), gotItem.bind(null, callback));
    }
    function gotItem (callback, err, community) {
        callback(err ? err : community.toJSON());
    }

    function list (db, callback) {
        db.community.find({join: [db.community.model.join.open, db.community.model.join.request], status: db.community.model.status.active }, gotItems.bind(null, callback));
    }
    function gotItems (callback, err, dCommunities) {
        var jCommunities = [];
        while (dCommunities && dCommunities.length) {
            jCommunities.push(dCommunities.shift().toJSON());
        }
        callback(err ? err : jCommunities);
    }

    module.exports.add = add;
    module.exports.update = update;
    module.exports.get = get;
    module.exports.list = list;
})();