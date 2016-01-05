
;(function accountModelClosure() {
    'use strict';
    var Encryption = require ( '../helpers/Encryption.js' );

    var status = { published: "published", draft: "draft", archived: "archived", history: "history"};
    var type = { topic: "topic", opinion: "opinion", comment: "comment", draftAlternative: "draftAlternative" };

    function toJSON (post) {
        return {
            id: Encryption.mask(post.id),
            status: post.status,
            created: post.created,
            modified: post.modified,
            content: post.content,
            paragraph: post.paragraph,
            endorse: post.endorse,
            report: post.report,
            children: post.children,
            author: post.authorJSON ? post.authorJSON : (post.author && post.author.toJSON ? post.author.toJSON() : undefined),
            authorId: Encryption.mask(post.authorId),
            community: post.communityJSON ? post.communityJSON : (post.community && post.community.toJSON ? post.community.toJSON() : undefined),
            communityId: Encryption.mask(post.communityId),
            history: post.history ? toList(post.history) : undefined
        };
    }

    function toList (list) {
        var posts = [];
        var i, listLength = list.length;
        for (i=0;i<listLength;i++) {
            var post = list[i];
            posts.push(post.toJSON());
        }
        return posts;
    }

    module.exports = {
        name: 'post',
        type: type,
        status: status,
        schema: {
            status: Object.keys(status),
            type: Object.keys(type),
            created: Date,
            modified: Date,
            content: String,
            paragraph: {type: 'integer'},
            endorse: {type: 'integer'},
            report: {type: 'integer'},
            children: {type: 'integer'}
        },
        relations: function (model, models) {
            model.hasOne('author',models.membership, { field: 'authorId', required: true });
            model.hasOne('community',models.community, { field: 'communityId', required: true });
            model.hasOne('topic',models.post, { field: 'topicId' });
            model.hasOne('parent',models.post, { field: 'parentId' });
        },
        methods: {
            toJSON:function thisToJSON() { return toJSON(this); }
        },
        validations: {},
        manualFields: ['status','content'],
        toJSON: toJSON,
        toList: toList,
        getNew: function getNew (membershipId, communityId, parentId, content, iType, iStatus) {
            var now = new Date ();
            return {
                authorId : membershipId,
                communityId: communityId,
                parentId: parentId,
                content: content,
                type: type[iType] ? type[iType] : type.published,
                status: status[iStatus] ? status[iStatus] : status.active,
                created: now,
                modified: now,
                endorse: 0,
                report: 0,
                children: 0
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