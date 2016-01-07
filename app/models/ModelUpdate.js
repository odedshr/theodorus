/** @module theodorus.models.ModelUpdate */
(function ModelUpdatelosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),

        /** @class theodorus.ModelUpdate */
        ModelUpdate = AbstractModelLibrary.model({
            autoId: false,

            collection: "model_update",
            key:"model",
            schema: {
                "model": { type: "text", size: 20, isNullOk:false },
                "modified": { type: "date", time: true, isNullOk:false }
            }
        });

    ///////////////////////////////
    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.model = function () { return ModelUpdate; };
    }
})();