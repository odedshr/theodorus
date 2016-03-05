
;(function accountModelClosure() {
    'use strict';
    var Encryption = require ( '../helpers/Encryption.js' );
    var utils = require ( '../helpers/modelUtils.js' );

    var status = { published: "published", draft: "draft", archived: "archived", history: "history"};

    function toJSON (post) {
        return {
            id: Encryption.mask(post.id),
            status: post.status,
            created: post.created,
            modified: post.modified,
            content: post.content,
            endorse: post.endorse,
            report: post.report,
            comments: post.comments,
            author: post.authorJSON ? post.authorJSON : (post.author && post.author.toJSON ? post.author.toJSON() : undefined),
            authorId: Encryption.mask(post.authorId),
            community: post.communityJSON ? post.communityJSON : (post.community && post.community.toJSON ? post.community.toJSON() : undefined),
            communityId: Encryption.mask(post.communityId),
            history: post.history ? utils.toList(post.history) : undefined
        };
    }

    module.exports = {
        name: 'opinion',
        status: status,
        schema: {
            status: Object.keys(status),
            created: Date,
            modified: Date,
            content: String,
            endorse: {type: 'integer'},
            report: {type: 'integer'},
            comments: {type: 'integer'}
        },
        relations: function (model, models) {
            model.hasOne('author',models.membership, { field: 'authorId', required: true });
            model.hasOne('community',models.community, { field: 'communityId', required: true });
            model.hasOne('topic',models.topic, { field: 'topicId' });
        },
        methods: {
            toJSON: function thisToJSON() { return toJSON(this); }
        },
        validations: {},
        manualFields: ['status','content'],
        toJSON: toJSON,
        toList: utils.toList,
        getNew: function getNew (membershipId, communityId, topicId, content, iStatus) {
            var now = new Date ();
            return {
                authorId : membershipId,
                communityId: communityId,
                topicId: topicId,
                content: content,
                status: status[iStatus] ? status[iStatus] : status.published,
                created: now,
                modified: now,
                endorse: 0,
                report: 0,
                comments: 0
            };
        }
    };

})();

/*
 *   - Topic is the beginning of a discussion in a community.
 - It contains a message of 140 characters
 - It may contain up to 140 different links
 - It has a single creator (a user)
 - Response is a user's response to a topic
 - It contains a message of 140 characters (or 140 links)
 - A user may have a single response per topic
 - Comment is a feedback to a response or to another comment
 - It contains a message of 100 words
 - A user may have many comments to per response
 * */