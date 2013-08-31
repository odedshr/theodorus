var Backbone = (Backbone || require("Backbone"));

var AbstractModel = Backbone.Model.extend({
    autoId: false,
    initialize: function(data) {
        var schema = this.schema;
        for (var key in schema) {
            if (data && data[key]) {
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
    },

    xml: function() {
        var tag = this.constructor.name;
        return "<"+tag+" />";
    },

    xmlAttribute: function(attribute) {
        var value = this.get(attribute);
        if (value=="undfined") {
            return "";
        }
        if (typeof value == "object" && value.xml) {
            return value.xml();
        }
        if (this.schema[attribute]=="date" && (typeof prettyDate !== "undefined")) {
            var dateCode =prettyDate(value);
            var numValue = Number(dateCode.replace(/\D/g,""));
            return "<"+attribute+" timestamp='"+value+"' value='"+numValue+"'>"+dateCode.replace(/(\d)./g,"x")+"</"+attribute+">";
        }
        return "<"+attribute+">"+value+"</"+attribute+">";
    }
});


var AbstractCollection = Backbone.Collection.extend ({
    name: "collection",
    xml: function () {
        var xml = "";
        this.forEach(function(model) {
            xml+= "\n\t"+model.xml();
        });
        return "<"+this.name+">"+xml+"</"+this.name+">";
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
