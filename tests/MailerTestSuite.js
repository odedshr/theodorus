exports.getTests = function MailerTests () { return []; };

exports.getAsyncTests = function MailerAsyncTests (QUnit) {
    var config = config || require("../config.json"), // required because of the profile_image_folders
        qunit = QUnit,
        assets = {
            vars : function vars(varName, isRequired) {
                var variable = process.env[varName];
                if (typeof variable === "undefined") {
                    variable = config[varName];
                    if (typeof variable === "undefined" && isRequired) {
                        throw Error("The required variable "+varName + " was not found. Please fix problem and try again");
                    }
                }
                return variable;
            },
            xslt : function xslt(jsonObject) {
                return JSON.stringify(jsonObject);
            }
        };

        lib = require ("./Mailer.js");

    lib.init(assets);

    return [
        function testMailer (assert) {
            lib.mail({
                emailTemplate: "email-confirm"
            },function callback(output){
                console.log("An email message was sent to the default email address");
                assert.ok(output.envelope,"Sending mail failed: " + JSON.stringify(output));
                qunit.start();
            });
        },

        function testMailerWithNoTemplate (assert) {
            try {
                lib.mail({},function callback(output){
                    assert.fail(true,"fail for no template");
                    qunit.start();
                });
            } catch (err) {
                assert.ok(err.message=="missing-parameters-emailTemplate","Suppose to fail on missing-parameters-emailTemplate but failed on " +err.message);
            }
        }
    ];
};