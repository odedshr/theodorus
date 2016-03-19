(function colorEnclosure() {
  var palette = {
    reset : 0,
    hicolor : 1,
    underline : 4,
    inverse : 7,
    black : 30,
    red : 31,
    green : 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    bgBlack: 40,
    bgRed: 41,
    bgGreen: 42,
    bgYellow: 43,
    bgBlue: 44,
    bgMagenta: 45,
    bgCyan: 46,
    bgWhite: 47,
  };

  var keys = Object.keys(palette);
  while (keys.length) {
    var key = keys.pop();
    palette[key] = '\033['+palette[key]+'m';
  }

  module.exports = palette;
})();
