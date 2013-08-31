function isDefined (obj) {
    return (typeof obj != "undefined")
}

////////////////////////////////////////////////////

function transform ( targetQuery, xml, successFunction) {
    (targetQuery ? $(targetQuery) : $).transform ({
        async: false,
        xslCache: true,
        xmlstr:"<xml>"+xml+"</xml>",
        xsl: "/ui/xslt/default.xsl",
        success: successFunction,
        error: function (output) {
            console.error ("error transforming "+ output);
        }
    });
}
////////////////////////////////////////////////////
function getFormFields (formElement) {
    var formFields = formElement.elements;
    var data = {}
    for (var x in formFields) {
        var element = formFields[x];
        if (element.name) {
            data[element.name] = (element.type=="checkbox") ? (element.checked) : element.value;
        }
    }
    return data;
}

////////////////////////////////////////////////////
window.onerror = function (message, url, linenumber) {
    alert("JavaScript error: " + message + " on line " + linenumber + " for " + url);
};


////////////////////////////////////////////////////

// delay is used for keyup delay
var delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

////////////////////////////////////////////////////

// ScriptLoader is used to load a set of scripts (instead of nesting them one after the other, this way the run in parallel)
/*ScriptLoader = function (scriptsToLoad, callback) {
    this.scriptsToLoadCount = scriptsToLoad.length;
    this.callback = callback;
    scriptsToLoad.forEach(function (script) {
        jQuery.getScript( script, this.onScriptLoaded.bind(this) );
    }, this);
};
ScriptLoader.prototype.onScriptLoaded = function () {
    if (0 == --this.scriptsToLoadCount) {
        this.callback();
    }
}*/

////////////////////////////////////////////////////

ExternalWindow = _.extend({}, {
    open : function (url, callback) {
        this.callback = callback;
        this.externalWindow = window.open(url);
        return this.externalWindow;
    },

    callback : function (data) {
        if (this.externalWindow) {
            this.externalWindow.close();
            this.externalWindow = null;
        } else {
            console.error("no this.externalWindow?! how you go here?")
        }
        this.callback(data)
    },

    windowCallback : function (res) {
        if (typeof res.error === "undefined") {
            if (window.opener) {
                window.opener.ExternalWindow.callback ( res);
                window.close();
            } else {
                location.href = location.href.substr(0, location.href.indexOf("?"));
            }
        } else {
            transform($("#messages"),"<message type='error' message='"+res.error+"' />");
        }
    }
});

////////////////////////////////////////////////////

/*function addMethod(object, name, fn) {
    var old = object[name];
    object[name] = function() {
        if (fn.length == arguments.length) {
            return fn.apply(this, arguments)
        } else if (typeof old == 'function') {
            return old.apply(this, arguments);
        }
    };
}

////////////////////////////////////////////////////

function isFunction(fn) {
    return Object.prototype.toString.call(fn) === "[object Function]";
}*/