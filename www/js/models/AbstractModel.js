var Backbone = (Backbone || require("backbone"));

var AbstractModel = Backbone.Model.extend({
    autoId: false,
    initialize: function(data) {
        if (typeof this.schema == "undefined") {
            throw "model-has-no-schema";
        }
        var schema = this.schema;
        for (var key in schema) {
            if (data && data.hasOwnProperty(key)) {
                this.set(key, data[key]);
            } else {
                switch (schema[key]) {
                    case "number" : this[key] = 0; break;
                    case "boolean" : this[key]  = false; break;
                    case "array" : this[key]  = []; break;
                    default: this[key] = null;
                }
            }
        }
    }
});

var AbstractCollection = Backbone.Collection.extend ({
    name: "collection",
    getPage: function () {
        if (typeof this.url == "undefined") {
            throw "called-getPage-on-collection-with-no-url";
        }
        var matches = this.url.match(/:\d+/);
        return (matches ? matches[0].replace(/\D/g,"")*1 : 0);
    },

    setPage: function(pageNum) {
        if (typeof this.url == "undefined") {
            throw "called-setPage-on-collection-with-no-url";
        }
        if (isNaN(pageNum)) {
            throw "pageNum-parameter-must-be-a-number";
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
    exports.model = function () {
        return AbstractModel;
    };

    exports.collection = function () {
        return AbstractCollection;
    };
}
