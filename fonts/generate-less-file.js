(function () {
    'use strict';
    var fs = require('fs');
    var string = fs.readFileSync ('styles.css', 'utf-8');
    var iconPattern = new RegExp('(\\.icon-)(.*)(:before {)','g'); // (.+?)(\)
    var item;
    while (item = iconPattern.exec(string)) {
        string = string.split(item[0]).join( '[data-ico="' + item[2] + '"]:before {' );
        iconPattern.lastIndex = 0;
    }
    string = string
        .replace('[data-icon]','[data-ico]')
        .replace('  content: attr(data-icon);\n','')
        .replace(/"fonts/g,'"../fonts');

    fs.writeFileSync ('../less/theodorus.webfont.less', string);
})();