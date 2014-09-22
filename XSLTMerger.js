(function XSLTMergerClosure() {
    var fs = require ("fs"),
        xsltFileName = "./static/themes/default.rtl/xslt/default.xsl";

    fs.exists(xsltFileName, function existsCallback (exists) {
        if (exists) {
            var text = fs.readFileSync(xsltFileName,'utf8'),
                res = text.match(/\<xsl\:include href\=\"(.*)\.xsl\" \/\>/g),
                i;
            console.log (JSON.stringify(i));
            for (i in res) {
                console.log (res[i]);
            }
        } else {
            console.error(xsltFileName + " not found");
        }
    });
})();