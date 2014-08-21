var XSLT = (function XSLTRendererClosure () {
    var XSLTRenderer = (function () {
        return {
            uiVersion : "?",
            templateFolder : false,
            useLocalStorage : false,

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
                        xml += ind + this.json2xmlEngine(jsObj[i], tagName, ind+"\t") + "\n";
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
                                    children += this.json2xmlEngine(child, attrName, ind+"\t");
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
                    xml += this.json2xmlEngine(jsObj[child], child, "");
                }
                return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
            }
        };
    })();

    if (typeof exports !== "undefined") {
        XSLTRenderer.engine = require('node_xslt');
        XSLTRenderer.cheerio = require('cheerio');

        XSLTRenderer.transform = function transform (content) {
            try {
                //console.log(JSON.stringify(content));
                //console.log(this.json2xml (content)); // this is a good place to check the input-xml
                if ((typeof content === "object")) {
                    if (content.app) {
                        content.app["@version"] = this.uiVersion;
                    }
                    content = this.json2xml (content);
                }
                var xsltDocument = this.engine.readXsltFile(this.templateFolder+"/xslt/default.xsl"),
                    xmlDocument = this.engine.readXmlString("<xml>"+content+"</xml>"),
                    output = this.engine.transform( xsltDocument,xmlDocument, []);

                var $ = XSLTRenderer.cheerio.load(output);
                $("#plugins").children().each(function repositionPlugin(index,domElement) {
                    try {
                    var info = $(this).attr("class").match(/reposition-(\w*)-([\w\d\-_]*)/);

                    if (info) {
                        var position = info[1],
                            target = $("#"+info[2]);

                        if (target.html() != "null") {
                            switch (position) {
                                case "before": target.before(domElement); break;
                                case "prepend": target.prepend(domElement); break;
                                case "append": target.append(domElement); break;
                                case "after": target.after(domElement); break;
                            }
                        }
                    }
                    } catch (error) {
                        console.error("failed to reposition item #"+index+":" + $(this).html());
                    }
                });
                //console.log($.html());
                //console.error(JSON.stringify(content));
                return $.html();
            } catch (error) {
                console.error("failed to xslt "+ ((typeof content === "object") ? this.json2xml (content) : content) +"\n" + error);
                return "";
            }
        };

        XSLTRenderer.init = function init (templateFolder, uiVersion) {
            if (typeof templateFolder != "string") {
                throw {"message":"xslt-must-have-templateFolder"};
            }
            XSLTRenderer.templateFolder = templateFolder;
            XSLTRenderer.uiVersion = uiVersion;

            return XSLTRenderer.transform.bind(XSLTRenderer);
        };
        exports.init = XSLTRenderer.init;
    } else {
        $.getScript("/lib/jquery.transform.js",function(){});


        XSLTRenderer.transform = function transform(targetQuery, content, successFunction) {
            var transformData = {
                async: false,
                xslCache: true,
                xmlstr:"<xml>"+(typeof content == "string" ? content : this.json2xml(content))+"</xml>",
                xsl: "/ui/xslt/default.xsl",
                success: successFunction,
                error: function (output) {
                    console.error ("error transforming "+ output);
                }
            };

            if (this.useLocalStorage) {
                transformData.xslstr = localStorage.getItem("default.xsl");
            } else {
                transformData.xsl = "/ui/xslt/default.xsl";
            }
            (targetQuery ? $(targetQuery) : $).transform ();
        };

        XSLTRenderer.preloadXSLT = function preloadXSLT (callback) {
            function recursiveLoad (filename, callback) {
                var children = {};
                $.ajax({
                    cache: "true",
                    dataType: "text",
                    url : "/ui/xslt/" + filename,
                    success : function (data) {
                        localStorage.setItem(filename,data);
                        var imports = data.match(/<xsl:import href="([a-zA-Z0-9\-_.]+)" \/>/g);
                        if (imports && imports.length) {
                            children[filename] = imports.length;
                            var loopedFunction = function loopedFunction () {
                                children[filename]--;
                                if (!children[filename]) {
                                    callback();
                                }
                            };
                            for (var i in imports){
                                recursiveLoad (imports[i].match(/"([a-zA-Z0-9\-_.]+)"/)[0].replace(/"/g,""), loopedFunction);
                            }
                        } else {
                            callback();
                        }
                    }
                });
            }
            recursiveLoad ("default.xsl", callback);
        };
    }

    return XSLTRenderer;
})();