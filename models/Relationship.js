/*
 * Interaction is the relationship between user to another user in his community
 - He can follow (meaning, he'll get notification on the user's activities)
 - He can endorse (meaning, he'll automatically endorse anything the representative will endorse)
 - He can report of misconduct
 */

/*
 * Rating is set of values a user can give to topic/response/comment
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function RatingClosure() {
    'use strict';

    var status = { active: "active", suspended: "suspended", archived: "archived"};

    module.exports = {
        name: 'relationship',
        status: status,
        schema: {
            status: Object.keys(status),
            created: Date,
            modified: Date,
            endorse: Boolean,
            follow: Boolean,
            report: Boolean,
            block: Boolean
        },
        relations: function (model, models) {
            model.hasOne('member',models.membership, { field: 'memberId', required: true});
            model.hasOne('subject',models.membership, { field: 'subjectId', required: true});
        },
        methods: {},
        validations: {}
    };

})();