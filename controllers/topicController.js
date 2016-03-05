;(function topicControllerEnclosure() {
    'use strict';

    var Encryption = require ('../helpers/Encryption.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var chain = require('../helpers/chain.js');
    var validators = require('../helpers/validators.js');
    var Errors = require('../helpers/Errors.js');

    function add (authUser, communityId, content, status, db, callback) {
        var communityUnmaskedId = Encryption.unmask(communityId);

        var tasks = [ {name:'community', table:db.community, parameters: communityUnmaskedId, continueIf: chain.onlyIfExists },
                      {name:'author', table:db.membership, parameters: {userId: authUser.id, communityId: communityUnmaskedId }, continueIf: authorExistsAndCanSuggest }
        ];
        chain (tasks, addOnDataLoaded.bind(null, content, status, db, callback), callback);
    }

    function authorExistsAndCanSuggest (repository) {
        return (repository.author ? (repository.author.can ('suggest') ? true : Errors.noPermissions('suggest')) : Errors.notFound('member'));
    }

    function addOnDataLoaded (content, status, db, callback, data) {
        if (data.community.isTopicLengthOk(content)) {
            var santized = validators.sanitizeString(content);
            var s2 = validators.sanitizeString('text with <tag> and <b>more</b>');
            var topic = db.topic.model.getNew(data.author.id, data.community.id, validators.sanitizeString(content), status ? status : db.topic.model.status.published);
            db.topic.create(
                topic,
                chain.onSaved.bind(null, addOnDataSaved.bind(null, callback, data)));
        } else {
            callback(Errors.tooLong('topic'));
        }
    }

    function addOnDataSaved (callback, data, topicJSON) {
        if (!(data instanceof Error)) {
            var now = new Date();
            data.community.topics = data.community.topics + 1;
            data.community.modified = now;
            data.community.save();
            topicJSON.author = data.author.toJSON();
            topicJSON.community = data.community.toJSON();
        }
        callback(topicJSON);
    }

    function archive (authUser, topicId, db, callback) {
        update( authUser, { id: topicId, status: db.topic.model.status.archived }, db, callback );
    }

    function update (authUser, topic, db, callback) {
        if (topic.id) {
            db.topic.get(Encryption.unmask(topic.id), chain.onLoad.bind(null,'post',updateOnPostLoaded.bind(null, authUser, topic, db, callback),callback,true));
        } else {
            callback(404);
        }
    }
    function updateOnPostLoaded (authUser, newTopic, db, callback, oldTopic) {
        chain ([{name:'author', table:db.membership, parameters: oldTopic.authorId, continueIf: isPostBelongsToAuthor.bind(null, authUser.id) },
                {name:'community', table:db.community, parameters: oldTopic.communityId, continueIf: chain.onlyIfExists }
        ], updateOnCommunityLoaded.bind(null, oldTopic, newTopic, db.topic.model.status.archived, callback), callback);
    }

    function isPostBelongsToAuthor(userId, repository) {
        return (repository.author !== undefined) ? (repository.author.userId === userId ? true : Errors.noPermissions('update-topic')) : Errors.notFound('author');
    }

    function updateOnCommunityLoaded (oldTopic, newTopic, archivedStatus, callback, data) {
        if (oldTopic.opinions === 0 && oldTopic.follow === 0 && oldTopic.endorse === 0 && oldTopic.report === 0) {
            if ((oldTopic.status === archivedStatus) !== (newTopic.status === archivedStatus)) {
                data.community.topics = +data.community.topics + ((newTopic.status === archivedStatus) ? -1 : 1);
                data.community.save();
            }
            if (newTopic.content !== undefined) {
                if (data.community.isTopicLengthOk(newTopic.content)) {
                    oldTopic.content = newTopic.content;
                } else {
                    callback(Errors.tooLong('topic-content'));
                    return;
                }
            }
            oldTopic.status = newTopic.status ? newTopic.status : oldTopic.status;
            oldTopic.modified = new Date();
            oldTopic.save(chain.onSaved.bind(null, updatedOnSaved.bind(null, callback, data)));
        } else {
            callback(Errors.immutable('topic'));
        }
    }

    function updatedOnSaved (callback, data, topicJSON) {
        topicJSON.author = data.author.toJSON();
        topicJSON.community = data.community.toJSON();
        callback(topicJSON);
    }

    function get (authUser, topicId, db, callback) {
        db.topic.get(Encryption.unmask(topicId), chain.onLoad.bind(null, 'topic',getOnTopicLoaded.bind(null, authUser, db, callback), callback, true));
    }

    function getOnTopicLoaded (authUser, db, callback, topic) {
        chain ([{name:'topic', data: topic},
            {name:'community', table:db.community, parameters: topic.communityId, continueIf: chain.onlyIfExists},
            {name:'author', table:db.membership, parameters: topic.authorId},
            {name:'member', table:db.membership, parameters:
            { userId: authUser.id,
                communityId: topic.communityId
            }}
        ], getOnDataLoaded.bind(null, db, callback), callback);
    }

    function getOnDataLoaded (db, callback, data) {
        if (data.member || data.community.type !== db.community.model.type.exclusive) {
            data.topic.author = data.author;
            data.topic.community = data.community;
            callback(data.topic.toJSON());
        } else {
            callback (Errors.noPermissions('get-topic'));
        }
    }

    function list (optionalUser, communityId, db, callback) {
        var communityUnmaskedId = Encryption.unmask(communityId);
        if (isNaN(communityUnmaskedId)) {
            callback(Errors.badInput('communityId',communityId));
        } else {
            var memberTask = { name:'member',
                continueIf: onlyIfExistsOrPublicCommunity.bind(null,db.community.model.type.exclusive)};
            if (optionalUser !== undefined)  {
                memberTask.table = db.membership;
                memberTask.parameters = {userId: optionalUser.id, communityId: communityUnmaskedId };
            }
            chain([ {name:'community', table:db.community, parameters: communityUnmaskedId, continueIf: chain.onlyIfExists },
                memberTask,
                {name:'topics', table:db.topic, parameters: { communityId: communityUnmaskedId, status: db.topic.model.status.published }, multiple: { order: 'modified' }, continueIf: listAddAuthorsTask.bind(null,db.membership) }
            ], listOnDataLoaded.bind(null,db,callback),callback);
        }
    }

    function onlyIfExistsOrPublicCommunity (communityTypeExclusive, repository) {
        return ((repository.member !== undefined) || (repository.community.type !== communityTypeExclusive)) ? true : Errors.noPermissions('topics') ;
    }

    function listAddAuthorsTask (membershipTable, repository, tasks) {
        repository.topics.reverse(); // changing to descending order
        var topicsLength = repository.topics.length;
        var authors = {};
        for (var i=0; i < topicsLength; i++) {
            authors[repository.topics[i].authorId] = true;
        }
        authors = Object.keys(authors);
        if (authors.length > 0) {
            tasks.push ( {name:'authors', table: membershipTable, parameters: { id: authors }, multiple: {}});
        }
        return true;
    }

    function listOnDataLoaded (db,callback, data) {
        var topicsLength = data.topics.length;
        if (topicsLength > 0) {
            //var communityJSON = data.community.toJSON();
            var authorsMap = db.membership.model.toMap(data.authors);
            while (topicsLength--) {
                var topic = data.topics[topicsLength];
                //topic.communityJSON = communityJSON; // it's one community, no need to load it per item
                topic.authorJSON = authorsMap[Encryption.mask(topic.authorId)];
            }
        }
        callback(db.topic.model.toList(data.topics));
    }

    module.exports.add = add;
    module.exports.update = update;
    module.exports.get = get;    // get topic content
    module.exports.list = list;  // get topics list of a community
    module.exports.archive = archive;
})();