(function () {
    'use strict';
    var fs = require('fs');
    var string = fs.readFileSync ('styles.css', 'utf-8');
    var iconPattern = new RegExp('(\\.icon-)(.*)(:before {)','g'); // (.+?)(\)
    var item;
    while ((item = iconPattern.exec(string)) !== null) {
        string = string.split(item[0]).join( ''.concat('.icon-', item[2], ':before, .icon-', item[2], '-before, [data-ico="', item[2], '"]:before {') );
    }
    string = string
        .replace('[data-icon]','[data-ico]')
        .replace('  content: attr(data-icon);\n','')
        .replace(/"fonts/g,'"../fonts');

    fs.writeFileSync ('../less/theodorus.webfont.less', string);
})();
