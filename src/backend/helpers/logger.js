;(function loggerEnclosure() {
  'use strict';

  function Logger() {
    this.config = {
      output: {
        console: {
          minLevel: 'log',
          color: true,
          write: this._writeToConsole.bind(this)
        }
      },
      prefix: [this.getTimeStamp.bind(this), this.getProcessId.bind(this)],
      suffix: []
    };

    this.main = this.log.bind(this, 'log');
    this.main.config = this.config;
    this.main.color = this.colors;
    this.main.info = this.log.bind(this, 'info');
    this.main.log = this.log.bind(this, 'log');
    this.main.warn = this.log.bind(this, 'warn');
    this.main.error = this.log.bind(this, 'error');

    return this.main;
  }

  Logger.prototype = {
    _levels: {
      log: 0,
      info: 1,
      warn: 2,
      error: 3
    },

    log: function log(level/*, arguments */) {
      var i, key,
          output,
          prefix = this.config.prefix || [],
          suffix = this.config.suffix || [];

      //push out level
      Array.prototype.shift.call(arguments);

      for (key in this.config.output) {
        output = this.config.output[key];

        if (this._levels[level] >= this._levels[output.minLevel]) {
          for (i = 0; i < prefix.length; i++) {
            Array.prototype.unshift.call(arguments, prefix[i](level, output.color));
          }

          for (i = 0; i < suffix.length; i++) {
            Array.prototype.push.call(arguments, suffix[i](level, output.color));
          }

          output.write.call(this, level, arguments);
        }
      }
    },

    getTimeStamp: function getTimeStamp(level, colored) {
      var now = new Date(),
          time = ('0' + now.getHours()).slice(-2) + ':' +
                 ('0' + now.getMinutes()).slice(-2) + ':' +
                 ('0' + now.getSeconds()).slice(-2),
          date = now.getFullYear() + '/' +
                 ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
                 ('0' + now.getDate()).slice(-2),
          output = this.colors.dim;

      if (colored) {
        switch (level) {
          case 'info': output = this.colors.bgBlue; break;
          case 'warn': output = this.colors.bgMagenta; break;
          case 'error': output = this.colors.bgRed; break;
        }
        output += date + ' ' + this.colors.yellow + time + this.colors.reset;
      } else {
        output = date + ' ' + time;
      }

      return output;
    },

    getProcessId: function getProcessId(level, colored) {
      var id = process.pid,
          colorSet;

      if (colored) {
        colorSet = this.colorSets[id % this.colorSets.length];

        return this.colors[colorSet[0]] + this.colors[colorSet[1]] + id + this.colors.reset;
      }

      return id;
    },

    colorSets: [['bgBlack', 'white'],
                ['bgBlack', 'red'],
                ['bgBlack', 'green'],
                ['black', 'blue'],
                ['bgBlack', 'yellow'],
                ['bgBlack', 'magenta'],
                ['bgBlack', 'cyan'],
                ['bgWhite', 'red'],
                ['bgWhite', 'green'],
                ['bgWhite', 'blue'],
                ['bgWhite', 'magenta'],
                ['bgWhite', 'cyan'],
                ['bgWhite', 'black']],

    colors: (function initColors() {
      var key,
        palette = {
          reset: 0,
          bright: 1,
          dim: 2,
          underline: 4,
          inverse: 7,
          black: 30,
          red: 31,
          green: 32,
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
        },
        keys = Object.keys(palette);

      while (keys.length) {
        key = keys.pop();
        palette[key] = '\x1B[' + palette[key] + 'm';
      }

      return palette;
    })(),

    _writeToConsole: function _writeToConsole(level, args) {
      var i;

      for (i = 0; i < args.length; i++) {
        if (args[i] instanceof Error && args[i].stack) {
          Array.prototype.splice.call(this, args, i, 1, this._getFlattenStack(args[i]));
        }
      }

      console[level].apply({}, args);
    },

    _getFlattenStack: function getFlattenStack(error) {
      var stack = error.message,
          ptr;

      if (typeof error.stack.replace === 'function') {
        stack = '\n' + JSON.stringify(error.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n'), null, 4);
      } else {
        ptr = error;

        while (ptr.stack) {
          if (ptr.stack.message) {
            stack = stack.concat('\n' + ptr.stack.message);
          }

          ptr = ptr.stack;
        }
      }

      return stack;
    }
  };

  module.exports = new Logger();
})();
