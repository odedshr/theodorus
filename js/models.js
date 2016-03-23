app = (typeof app != "undefined") ? app:{};
(function modelsEnclosure() {
    'use strict';
    var emailPatternString = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))';

    this.models = this.models || {};
    var models = this.models;

    function defaultTrue (value) {
        return true;
    }

    function validateMaskedId (value) {
        return true;
    }

    function validateOptionalMaskedId (value) {
        return (value === undefined || validateMaskedId(value));
    }

    models.user = {
        status: {
            enum: { active: "active", suspended: "suspended", archived: "archived"},
            validate: function (value) { return true; }
        },
        created: {},
        modified: {},
        lastLogin:  {},
        email: {
            validate: function validateEmail (value) {
                if (value.match(emailPatternString)) {
                    return true;
                }
            }
        },
        password: {
            validate: function validatePassword (value) {
                return value && value.length>0;
            }
        },
        birthDate: {},
        isFemale: {}
    };
    models.community = {};
    models.membership = {};
    models.topic = {
        content: {
            validate : function validatTopicContent( value, community) {
                return true;
            }
        }
    };
    models.opinion = {
        id: {
            validate : validateOptionalMaskedId
        },
        topicId: {
            validate : validateMaskedId
        },
        content: {
            validate : function validatOpinionContent( value, community) {
                return true;
            }
        }
    };
    models.comment = {
        id: {
            validate : validateOptionalMaskedId
        },
        opinionId: {
            validate : validateMaskedId
        },
        parentId: {
            validate : validateOptionalMaskedId
        },
        content: {
            validate : function validatCommentContent( value, community) {
                return true;
            }
        }
    };
    models.feedback = {
        id: {
            validate : validateOptionalMaskedId
        },
        image: {
            validate : defaultTrue
        },
        content: {
            validate : function validatFeedbackContent( value ) {
                return value > 0;
            }
        }
    };

return this;}).call(app);
