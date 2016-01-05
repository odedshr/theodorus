/*
* id
* status
* created
* content
* user-id
*
* * ProfileImage is an image that belongs to a user
 - he can link it to different memberships
 - user can add up to 10 different profileImages
 - User can only remove profilesImages that are not linked to a membership
* */

/*
 * Rating is set of values a user can give to topic/response/comment
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function ImageClosure() {
    'use strict';

    var status = { active: "active", suspended: "suspended", archived: "archived"};

    module.exports = {
        name: 'image',
        status: status,
        schema: {
            status: Object.keys(status),
            created: Date,
            slug: String,
            content: Buffer
        },
        relations: function (model, models) {
            model.hasOne('member',models.membership, { field: 'memberId', required: true});
        },
        methods: {},
        validations: {}
    };

})();