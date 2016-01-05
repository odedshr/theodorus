;(function ProposalClosure() {
    'use strict';

    var status = { active: "active", suspended: "suspended", archived: "archived"};

    module.exports = {
        name: 'proposal',
        status: status,
        schema: {
            status: Object.keys(status),
            created: Date,
            modified: Date,
            content: String,
            noParagraphCount: Object
        },
        relations: function (model, models) {
        },
        methods: {},
        validations: {}
    };

})();