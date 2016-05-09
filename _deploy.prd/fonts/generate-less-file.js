/*jshint esversion: 6 */
(function () {
  'use strict';
  var fs = require('fs');
  var string = fs.readFileSync('styles.css', 'utf-8');
  var iconPattern = new RegExp('(\\.icon-)([\\w\\-]*)(:before {)', 'g'); // (.+?)(\)
  var item;
  while ((item = iconPattern.exec(string)) !== null) {
    console.log(JSON.stringify(item));
    var replaceWith = `.icon-${item[2]}:before, .ico-${item[2]}, [data-ico="${item[2]}"]:before {`;
    string = string.split(item[0]).join(replaceWith);
  }

  string = string
    .replace('[data-icon]', '[data-ico]')
    .replace('  content: attr(data-icon);\n', '')
    .replace(/"fonts/g, '"../fonts');

  fs.writeFileSync('../less/theodorus.webfont.less', string);
})();
