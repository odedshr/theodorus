;(function UserClosure() {
    'use strict';

    var status = { active: "active", suspended: "suspended", archived: "archived"};

    module.exports = {
        name: 'user',
        status: status,
        schema: {
            status: Object.keys(status),
            created: Date,
            modified: Date,
            lastLogin:  Date,
            email: String,
            password: String,
            birthDate: Date,
            isFemale: Boolean
        },
        relations: function (model, models) {
        },
        methods: {},
        validations: {}
    };

})();