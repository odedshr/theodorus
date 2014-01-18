var Backbone = (Backbone || require("backbone"));

var AbstractModel = Backbone.Model.extend({
    autoId: false,
    initialize: function(data) {
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
    }/*,

     XML output is deprecated: use json2xml instead
    xml: function() {
        var tag = this.constructor.name;
        return "<"+tag+" />";
    },

    xmlAttribute: function(attribute) {
        var value = this.get(attribute);
        if (!value || value=="undfined") {
            return "";
        }
        if (value && (typeof value == "object") && value.xml) {
            return value.xml();
        }
        if (this.schema[attribute]=="date" && (typeof prettyDate !== "undefined")) {
            try {
                var formattedDate = (new Date(value)).format();
                var dateCode =prettyDate(value);
                var numValue = Number(dateCode.replace(/\D/g,""));
                return "<"+attribute+" timestamp='"+value+"' formatted='"+formattedDate+"' value='"+numValue+"'>"+dateCode.replace(/(\d)+/g,"#")+"</"+attribute+">";
            } catch(error) {
                return "";
            }

        }
        return "<"+attribute+">"+value+"</"+attribute+">";
    }*/
});


var AbstractCollection = Backbone.Collection.extend ({
    name: "collection",
    getPage: function () {
        var matches = this.url.match(/:\d+/);
        return (matches ? matches[0].replace(/\D/g,"")*1 : 0);
    },

    setPage: function(pageNum) {
        var matches = this.url.match(/:\d+/);
        if (matches) {
            this.url = this.url.replace(/:\d+/,":"+pageNum);
        } else {
            this.url = (this.url+"/:"+pageNum).replace(/\/\/:/,"/:");
        }
    },

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
