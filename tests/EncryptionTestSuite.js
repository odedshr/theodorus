exports.getTests = function EncryptionTestSuite () {
    var config = config || require("../config.json"), // required because of the profile_image_folders
        vars = function vars(varName, isRequired) {
            var variable = process.env[varName];
            if (typeof variable === "undefined") {
                variable = config[varName];
                if (typeof variable === "undefined" && isRequired) {
                    throw Error("The required variable "+varName + " was not found. Please fix problem and try again");
                }
            }
            return variable
        },
        lib = require ("../www/js/utils/Encryption.js");

    lib.init(vars);

    return [
        function testEncrypt (assert) {
            assert.ok (lib.encrypt("md5")=="1bc29b36f623ba82aaf6724fd3b16718","sting is md5-ed");
        },

        function testRSAEncrypt (assert) {
            assert.ok (lib.rsaEncrypt("rsa")=="2944786a63fe051ed51a609d8eebc138","sting is rsa-encrypted");
        },

        function testRSADecrypt (assert) {
            assert.ok (lib.rsaDecrypt("2944786a63fe051ed51a609d8eebc138")=="rsa","sting is rsa-decrypted");
        }
    ];
}