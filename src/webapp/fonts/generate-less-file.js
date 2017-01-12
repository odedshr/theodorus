/*jshint esversion: 6 */
;(function generateLessFile() {
  'use strict';
  // this takes the css file created by fontastic, and create a mixin file with all font definitions
  // + updates the original file to the right folder

  var fs = require('fs'),
    string = fs.readFileSync('styles.css', 'utf-8'),
    output = [],
    iconPattern = new RegExp('\\.icon-([\\w\\-]*):before {\\n\\s*content: ("\\\\[\\w]*");\\n}','gm'),
    item, iconName, iconContent, replaceWith;

  while ((item = iconPattern.exec(string)) !== null) {
    iconName = item[1];
    iconContent = item[2];
    output.push('@icon-' + item[1] + ': ' + item[2] + ';' );
    replaceWith = `.icon-${iconName}:before, .ico-${iconName}, [data-ico="${iconName}"]:before {
    content: @icon-${iconName};
  }`;
    string = string.split(item[0]).join(replaceWith);
  }

  string = '@import "theodorus.webfont.def.less";\n' + string
    .replace('[data-icon]', '[data-ico]')
    .replace('  content: attr(data-icon);\n', '')
    .replace(/"fonts/g, '"../fonts');

  fs.writeFileSync('../less/theodorus.webfont.less', string);
  fs.writeFileSync('../less/theodorus.webfont.def.less', output.join('\n'));
})();
