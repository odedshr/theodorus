/*function isDefined (obj) {
    return (typeof obj != "undefined")
}*/

////////////////////////////////////////////////////

utils = {
    date: {
        /*
         * @param {string} dateString - ISO date formatted string
         */
        pretty : function pretty (dateString) {
            /*
             * JavaScript Pretty Date
             * Copyright (c) 2011 John Resig (ejohn.org)
             * Licensed under the MIT and GPL licenses.
             */

            // Takes an ISO time and returns a string representing how
            // long ago the date represents.
            var date = new Date((dateString || "")),//.replace(/-/g,"/").replace(/[TZ]/g," ") => this appeared in the original code, it reset timezones...
                diff = (((new Date()).getTime() - date.getTime()) / 1000),
                day_diff = Math.floor(diff / 86400);

            if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) {
                return dateString;
            }

            return day_diff == 0 && (
                diff < 60 && "just-now" ||
                    diff < 120 && "a-minute-ago" ||
                    diff < 240 && "two-minutes-ago" ||
                    diff < 900 && Math.floor( diff / 60 ) + "-minutes-ago" ||
                    diff < 1800 && "quarter-of-an-hour-ago" ||
                    diff < 2400 && "half-of-an-hour-ago" ||
                    diff < 3600 && Math.floor( diff / 60 ) + "-minutes-ago" ||
                    diff < 7200 && "an-hour-ago" ||
                    diff < 1440 && "two-hours-ago" ||
                    diff < 86400 && Math.floor( diff / 3600 ) + "-hours-ago") ||
                day_diff == 1 && "yesterday" ||
                day_diff == 2 && "two-days-ago" ||
                day_diff < 7 && day_diff + "-days-ago" ||
                day_diff < 14 && "a-week-ago" ||
                day_diff < 21 && "two-weeks-ago" ||
                day_diff < 31 && Math.ceil( day_diff / 7 ) + "-weeks-ago";
        },
        /*
         * @param {string} dateString - ISO date formatted string
         */
        normal : function normal (dateString) {
            var d = new Date(dateString);
            return (("0" + (d.getDate() + 1)).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear() +", "+ ("0" + (d.getHours())).slice(-2)+":"+ ("0" + (d.getMinutes())).slice(-2));
        },
        /*
         * @param {string} dateString - ISO date formatted string
         */
        render : function render (dateString) {
            var dateCode = false,
                output = {};

            if (dateString && (typeof dateString) != "undfined") {
                try {
                    output.timestamp = dateString;
                    output.formatted = utils.date.normal(dateString);
                    dateCode = utils.date.pretty(dateString);
                    if (dateCode!==dateString) {
                        output.pattern = dateCode.replace(/(\d)+/g,"#");
                        output.patternValue = Number(dateCode.replace(/\D/g,""));
                    }
                } catch(error) {
                    console.error(error);
                }
            }
            return output;
        }
    },

    xslt : {
        transform : function transform(targetQuery, content, successFunction) {
            (targetQuery ? $(targetQuery) : $).transform ({
                async: false,
                xslCache: true,
                xmlstr:"<xml>"+(typeof content == "string" ? content : utils.xslt.json2xml(content))+"</xml>",
                xsl: "/ui/xslt/default.xsl",
                success: successFunction,
                error: function (output) {
                    console.error ("error transforming "+ output);
                }
            });
        },
        json2xmlEngine : function json2xmlEngine(jsObj, tagName, ind) {
            var filteredType = ["undefined","function"],
                xml = "",
                children = "",
                child,
                attrName;

            if (jsObj && jsObj.toJSON && (typeof jsObj.toJSON == "function")) {
                jsObj = jsObj.toJSON();
            }
            if (jsObj instanceof Array) {
                for (var i=0, length = jsObj.length; i<length; i++) {
                    xml += ind + utils.xslt.json2xmlEngine(jsObj[i], tagName, ind+"\t") + "\n";
                }
            } else if (typeof(jsObj) == "object") {
                xml += "\n"+ ind + "<" + tagName;
                for (attrName in jsObj) {
                    if (attrName.charAt(0) == "@") {
                        xml += " " + attrName.substr(1) + "=\"" + jsObj[attrName].toString() + "\"";
                    } else {
                        child = jsObj[attrName];
                        if ((filteredType.indexOf(typeof child)==-1)) { // && jsObj.hasOwnProperty(attrName)
                            if (attrName == "#text") {
                                children += child;
                            } else if (attrName == "#cdata") {
                                children += "<![CDATA[" + child + "]]>";
                            } else {
                                children += utils.xslt.json2xmlEngine(child, attrName, ind+"\t");
                            }
                        }
                    }
                }
                xml += (children.length) ? (">" + children + "</" + tagName + ">") : "/>";
            }
            else {
                xml += "\n" + ind + ("<" + tagName + ">" + jsObj.toString() +  "</" + tagName + ">");
            }
            return xml;
        },
        json2xml: function json2xml(jsObj, tab) {
            /*	This work is licensed under Creative Commons GNU LGPL License.

             License: http://creativecommons.org/licenses/LGPL/2.1/
             Version: 0.9
             Author:  Stefan Goessner/2006
             Web:     http://goessner.net/
             */
            var xml="";
            for (var child in jsObj) {
                xml += utils.xslt.json2xmlEngine(jsObj[child], child, "");
            }
            return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
        }
    }
}

if (typeof exports !== "undefined") {
    exports.json2xml = utils.xslt.json2xml;
    exports.getDetailedDate = utils.date.render;
} else {
    utils = _.extend(utils, {
        getFormFields : function getFormFields (formElement) {
            var formFields = formElement.elements;
            var data = {};
            for (var x in formFields) {
                var element = formFields[x];
                if (element.name) {
                    data[element.name] = (element.type=="checkbox") ? (element.checked) : element.value;
                }
            }
            return data;
        },

        ////////////////////////////////////////////////////

        delay:  (function(){
            var timer = 0;
            return function(callback, ms){
                clearTimeout (timer);
                timer = setTimeout(callback, ms);
            };
        })(),

        ExternalWindow : {
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
                        window.opener.ExternalWindow.callback (res);
                        window.close();
                    } else {
                        location.href = location.href.substr(0, location.href.indexOf("?"));
                    }
                } else {
                    transform($("#messages"),"<message type='error' message='"+res.error+"' />");
                }
            }
        }
    });

    ////////////////////////////////////////////////////

    window.onerror = function (message, url, linenumber) {
        alert("JavaScript error: " + message + " on line " + linenumber + " for " + url);
    };
}

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