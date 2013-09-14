Theodorus.View = Backbone.View.extend({
    xslt : null,

    setController : function (controller) {
        this.controller = controller;
    },

    setup : function (callback) {
        this.$el = ( this.$el ? $(this.$el.selector) : null);
        if (callback){
            callback();
        }
        return this;
    },

    setAsPopUp : function (yes) {
      this.isPopup = yes;
    },

    transform :  function ( xml, successFunction) {
        var jObj = $;
        var sFunction = successFunction;
        if (!this.isPopup && this.$el) {
            if (this.$el.size()===0) {
                this.$el = $(this.$el.selector);
            }
            if (this.$el.size()>0) {
                jObj = this.$el;
            } else {
                console.log("failed to find element ("+this.$el.selector+") for \n"+xml);
            }
        }
        if (this.isPopup) {
            sFunction = function (jObj) {
                $("#popup_placeholder").append(jObj);
                successFunction(jObj);
            };
        }
        jObj.transform ({
            async: false,
            xslCache: true,
            xmlstr:"<xml>"+xml+"</xml>",
            xsl: "/ui/xslt/default.xsl",
            success: sFunction,
            error: function (output) {
                alert ("error transforming :"+ output +"\n"+xml);
            }
        });
    },

    getFormFields : function  (formElement) {
        var formFields = formElement.elements;
        var data = {};
        for (var x in formFields) {
            var element = formFields[x];
            if (element.name) {
                data[element.name] = (element.type=="checkbox") ? (element.checked) : element.value;
            }
        }
        return data;
    }
});