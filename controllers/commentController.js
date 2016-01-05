;(function postControllerEnclosure() {
    'use strict';

    var Encryption = require ('../helpers/Encryption.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var chain = require('../helpers/chain.js');
    var validators = require('../helpers/validators.js');
    var Errors = require('../helpers/Errors.js');

    function add (authUser, opinionId, parentId, content, status, db, callback) {
        if ((opinionId === undefined) === (parentId === undefined)) {
            callback (Errors.badInput('must-have-opinionId-OR-commentId'));
        } else if (parentId === undefined) {
            db.opinion.get(Encryption.unmask(opinionId), chain.onLoad.bind(null,'opinion',addOnOpinionLoaded.bind(null, authUser, 'opinion', content, status, db, callback),callback,true));
        } else {
            db.comment.get(Encryption.unmask(parentId), chain.onLoad.bind(null,'comment',addOnOpinionLoaded.bind(null, authUser, 'parent', content, status, db, callback),callback,true));
        }

    }

    function addOnOpinionLoaded (authUser, findBy, content, status, db, callback, root) {
        var tasks = [ {name:  findBy, data: root },
            {name:'community', table:db.community, parameters: root.communityId, continueIf: chain.onlyIfExists },
            {name:'author', table:db.membership, parameters: {userId: authUser.id, communityId: root.communityId }, continueIf: chain.onlyIfExists }
        ];
        if (findBy === 'parent') {
            tasks.push ({name:'opinion', table:db.opinion, parameters: root.opinionId , continueIf: chain.onlyIfExists });
        }
        chain (tasks, addOnDataLoaded.bind(null, content, status, db, callback), callback);
    }

    function addOnDataLoaded (content, status, db, callback, data) {
        if (data.author.can ('comment')) {
            if (data.community.isCommentLengthOk(content)) {
                db.comment.create(db.comment.model.getNew(data.author.id, data.community.id, data.opinion.id, data.parent ? data.parent.id : undefined, validators.sanitizeString(content), status ? status : db.comment.model.status.published),
                                  chain.onSaved.bind(null, addOnDataSaved.bind(null, callback, data)));
            } else {
                callback(Errors.tooLong('comment'));
            }
        } else {
            callback(Errors.noPermissions('comment'));
        }
    }

    function addOnDataSaved (callback, data, commentJSON) {
        var now = new Date();
        var parent = data.parent ? data.parent : data.opinion;
        parent.comments = parent.comments + 1;
        parent.modified = now;
        parent.save();

        commentJSON.author = data.author.toJSON();
        commentJSON.community = data.community.toJSON();
        callback(commentJSON);
    }

    function archive (authUser, commentId, db, callback) {
        update( authUser, { id: commentId, status: db.comment.model.status.archived }, db, callback );
    }

    function update (authUser, comment, db, callback) {
        if (comment.id) {
            db.comment.get(Encryption.unmask(comment.id), chain.onLoad.bind(null,'comment',updateOnPostLoaded.bind(null, authUser, comment, db, callback),callback,true));
        } else {
            callback(404);
        }
    }
    function updateOnPostLoaded (authUser, newComment, db, callback, oldComment) {
        chain ([{name:'comment', data: oldComment},
                {name:'newComment', data: newComment},
                {name:'author', table:db.membership, parameters: oldComment.authorId, continueIf: isPostBelongsToAuthor.bind(null, authUser.id) },
                {name:'community', table:db.community, parameters: oldComment.communityId, continueIf: chain.onlyIfExists }
        ], updateOnCommunityLoaded.bind(null, db, callback), callback);
    }

    function isPostBelongsToAuthor(userId, repository, tasks, currentTask) {
        return (repository.author!== undefined) ? (repository.author.userId === userId ? true : Errors.noPermissions('update-comment')) : Errors.notFound();
    }

    function updateOnCommunityLoaded (db, callback, data) {
        if (data.community.isCommentLengthOk(data.newComment.content )) {
            if (data.comment.comments === 0 && data.comment.endorse === 0 && data.comment.report === 0) {
                data.comment.content = data.newComment.content ? data.newComment.content : data.comment.content;
                data.comment.status = data.newComment.status ? data.newComment.status : data.comment.status;
                data.comment.modified = new Date();
                data.comment.save(chain.onSaved.bind(null, updatedOnSaved.bind(null, callback, data)));
            } else {
                callback( Errors.immutable('comment' ));
            }
        } else {
            callback( Errors.tooLong('comment' ));
        }
    }

    function updatedOnSaved (callback, data, commentJSON) {
        commentJSON.author = data.author.toJSON();
        commentJSON.community = data.community.toJSON();
        callback(commentJSON);
    }

    function get (authUser, commentId, db, callback) {
        db.comment.get(Encryption.unmask(commentId), chain.onLoad.bind(null, 'comment',getOnCommentLoaded.bind(null, authUser, db, callback), callback, true));
    }

    function getOnCommentLoaded (authUser, db, callback, comment) {
        chain ([{name:'comment', data: comment},
            {name:'community', table:db.community, parameters: comment.communityId, continueIf: chain.onlyIfExists},
            {name:'author', table:db.membership, parameters: comment.authorId},
            {name:'member', table:db.membership, parameters:
            { userId: authUser.id,
                communityId: comment.communityId
            }}
        ], getOnDataLoaded.bind(null, db, callback), callback);
    }

    function getOnDataLoaded (db, callback, data) {
        if (data.member || data.community.join !== db.community.model.join.request) {
            data.comment.author = data.author;
            data.comment.community = data.community;
            callback(data.comment.toJSON());
        } else {
            callback (Errors.noPermissions('get-comment'));
        }
    }

    function list (authUser, opinionId, commentId, db, callback) {
        if ((opinionId === undefined) === (commentId === undefined)) {
            callback(Errors.badInput());
        } else if (opinionId !== undefined) {
            db.opinion.get(Encryption.unmask(opinionId), chain.onLoad.bind(null, 'opinion', listOnParentLoaded.bind(null, authUser, db, callback, 'opinion'), callback, 'parent'));
        } else if (commentId !== undefined) {
            db.comment.get(Encryption.unmask(commentId), chain.onLoad.bind(null, 'comment', listOnParentLoaded.bind(null, authUser, db, callback, 'parent'), callback, 'opinion'));
        }
    }

    function listOnParentLoaded (authUser, db, callback, findBy, root) {
        chain([{name: 'findBy', data: findBy}, {name: findBy, data: root},
            { name: 'community', table: db.community, parameters: root.communityId, continueIf: chain.onlyIfExists},
            { name: 'member', table: db.membership, parameters: { userId: authUser.id, communityId: root.communityId } }
        ], listOnMemberLoaded.bind(null, db, callback), callback);
    }

    function listOnMemberLoaded (db, callback, data) {
        if (data.member  || data.community.join !== db.community.model.join.request) {
            var query = {or: [ { status: db.comment.model.status.published } ,
                               { status: db.comment.model.status.draft, authorId: data.member.id }]};
            if (data.findBy === 'parent') {
                query.parentId = data.parent.id;
            } else if (data.opinion) {
                query.opinoinId = data.opinion.id;
            }
            db.comment.find( query, { order: 'created' }, chain.onLoad.bind(null, 'comments',listOnCommentsLoaded.bind(null, data, db, callback), callback, true));
        } else {
            callback (Errors.noPermissions('list-comments'));
        }
    }
    function listOnCommentsLoaded (data, db, callback, comments) {
        data.comments = comments;
        var i = comments.length, authorIdMap = {};
        while (i--) {
            authorIdMap[comments[i].authorId] = true;
        }
        db.membership.find({userId: Object.keys(authorIdMap)}, chain.onLoad.bind(null, 'authors',listOnAuthorsLoaded.bind(null, data, db, callback), callback, false));
    }
    function listOnAuthorsLoaded (data, db, callback, authors) {
        var commentsLength = data.comments.length;
        if (commentsLength > 0) {
            var communityJSON = data.community.toJSON();
            var authorsMap = db.membership.model.toMap(authors);
            while (commentsLength--) {
                var comment = data.comments[commentsLength];
                comment.communityJSON = communityJSON;
                comment.authorJSON = authorsMap[comment.authorId];
            }
        }
        callback(db.comment.model.toList(data.comments));
    }

    module.exports.add = add;
    module.exports.update = update;
    module.exports.get = get;    // get post content
    module.exports.list = list;  // get comment list of opinion/comment
    module.exports.archive = archive;
})();