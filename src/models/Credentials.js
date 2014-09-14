/** @module theodorus.models.Credentials */
(function CredentialsClosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
        /** @class Credentials */
        Credentials = AbstractModelLibrary.model({
            autoId: false,
            collection: "credentials",
            key: "auth_key",
            schema: {
                "auth_key": { type: "text", size: 128, isUnique: true, isNullOk: false },
                "password": { type: "text", size: 128, isNullOk: false },
                "user_id": { type: "integer", isNullOk: false, isSecondaryKey: true }
            }
        });

    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.model = function () {
            return Credentials;
        };
    }
})();