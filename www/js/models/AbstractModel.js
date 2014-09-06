var _ =  (_ || require("underscore")),
    Backbone = (Backbone || require("backbone")),
    abstractModelAttributes = {
        autoId: false,
        initialize: function(data) {
            if (typeof this.schema == "undefined") {
                throw new Error("model-has-no-schema");
            }
            var schema = this.schema;
            for (var key in schema) {
                if (data && data.hasOwnProperty(key)) {
                    this.set(key, data[key]);
                } else {
                    if (schema[key].defaultValue) {
                        this[key] = schema[key].defaultValue;
                    } else {
                        switch (schema[key].type) {
                            case "number" :
                            case "integer" : this[key] = 0; break;
                            case "boolean" : this[key]  = false; break;
                            case "array" : this[key]  = []; break;
                            default: this[key] = null;
                        }
                    }
                }
            }
        }
    };
    AbstractModel = _.extend(Backbone.Model.extend(abstractModelAttributes),abstractModelAttributes);

var AbstractCollection = Backbone.Collection.extend ({
    name: "collection",
    getPage: function () {
        if (typeof this.url == "undefined") {
            throw "called-getPage-on-collection-with-no-url";
        }
        var matches = this.url.match(/:\d+/);
        return (matches ? matches[0].replace(/\D/g,"")*1 : 1);
    },

    setPage: function(pageNum) {
        if (typeof this.url == "undefined") {
            throw new Error("called-setPage-on-collection-with-no-url");
        }
        if (isNaN(pageNum)) {
            throw new Error("pageNum-parameter-must-be-a-number");
        }
        var matches = this.url.match(/:\d+/);
        if (matches) {
            this.url = this.url.replace(/:\d+/,":"+pageNum);
        } else {
            this.url = (this.url+"/:"+pageNum).replace(/\/\/:/,"/:");
        }
        return this;
    }
});

if (typeof exports !== "undefined") {
    exports.model = function (attributes) {
        return attributes ? _.extend(AbstractModel.extend(attributes),attributes) : AbstractModel;
    };

    exports.collection = function () {
        return AbstractCollection;
    };
}
