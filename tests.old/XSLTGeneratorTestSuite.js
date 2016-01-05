exports.getTests = function XSLTGenerator () {
    var config = config || require("../src/config.json"), // required because of the profile_image_folders
        xslt = require("../utils/XSLTRenderer").init(__dirname + "/themes/"+config.theme,self.uiVersion);
    return [];
};