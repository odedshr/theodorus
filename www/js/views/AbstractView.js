Theodorus.View = Backbone.View.extend({
    setController : function (controller) {
        this.controller = controller;
    },

    setElement : function (element) {
        this.jElement = ((typeof element == "string") || (element instanceof HTMLElement)) ? $(element) : element;
    },

    setAsPopUp : function (yes) {
      this.isPopup = yes;
    },

    transform :  function ( xml, successFunction) {
        var jObj = $;
        var sFunction = successFunction;
        if (!this.isPopup && this.jElement) {
            if (this.jElement.size()===0) {
                this.jElement = $(this.jElement.selector);
            }
            if (this.jElement.size()>0) {
                jObj = this.jElement;
            } else {
                console.log("failed to find element ("+this.jElement.selector+") for \n"+xml);
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