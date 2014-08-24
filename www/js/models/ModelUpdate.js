(function ModelUpdatelosure () {
    var AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();

    var ModelUpdate = AbstractModel.extend({
        autoId: false,

        collection: "model_update",
        key:"model",
        schema: {
            "model":"string",
            "modified":"date"
        }
    });

    ///////////////////////////////
    if (typeof exports !== "undefined") {
        exports.model = function () { return ModelUpdate; };
    }
})();