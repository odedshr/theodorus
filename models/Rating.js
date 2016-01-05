/*
 * Rating is set of values a user can give to topic/response/comment
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function RatingClosure() {
    'use strict';

    var status = { active: "active", suspended: "suspended", archived: "archived"};

    module.exports = {
        name: 'rating',
        status: status,
        schema: {
            status: Object.keys(status),
            created: Date,
            modified: Date,
            read: Boolean,
            endorse: Boolean,
            follow: Boolean,
            report: Boolean
        },
        relations: function (model, models) {
            model.hasOne('member',models.membership, { field: 'memberId', required: true});
            model.hasOne('post',models.post, { field: 'postId', required: true});
        },
        methods: {},
        validations: {}
    };

})();