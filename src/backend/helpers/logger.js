import { colors } from 'groundup';

const levels = {
    info: 0,
    log: 1,
    warn: 2,
    error: 3
  },
  symbol = [`${colors.FgGreen}✔${colors.Reset}︎`, '✅', '⚠️', '❗'];

function zeroPad(num) {
  return ('0' + num).slice(-2);
}

class Logger {
  constructor() {
    this.colored = true;
    this.thresholdLevel = 0;
    this.console = console;
    this.prefix = [this.getLevelSymbol.bind(this), this.getTimeStamp.bind(this), this.getProcessId.bind(this)];
  }

  log(levelName, ...params) {
    const level = levels[levelName];

    if (level >= this.thresholdLevel) {
      const items = params
        .map(item => {
          if (item === undefined) {
            return 'undefined'
          } else if (item === null) {
            return 'null'
          } else if (item instanceof Error) {
            if (typeof (item.getStackTrace) === 'function') {
              return item.getStackTrace()
            } else {
              const stackContainer = {};

              Error.captureStackTrace(stackContainer);

              return `${ stackContainer.stack }\n${ item.toString() }\n${ JSON.stringify(item, null, 2) }`;
            }
          } else if (item.toString) {
            return item.toString();
          }

          return item;
        });

      items.unshift(this.prefix.map(method => method(level)).join(' '));
      this.console[levelName](...items);
    }
  }

  getLevelSymbol(level) {
    return `${symbol[level]} `;
  }

  getTimeStamp() {
    const now = new Date(),
      time = `${zeroPad(now.getHours())}:${zeroPad(now.getMinutes())}:${zeroPad(now.getSeconds())}`,
      date = `${now.getFullYear()}/${zeroPad(now.getMonth())}/${zeroPad(now.getDate())}`;

    return `${date} ${time}`;
  }

  getProcessId() {
    const id = process.pid;

    if (this.colored) {
      return `${colors.getSet(id)}${id}${colors.Reset}`;
    }

    return id;
  }

  getFlattenStack(error) {
    let stack = error.toString ? error.toString() : error.message,
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
}

class Facade {
  constructor() {
    this.logger = new Logger();
  }

  info() { this.logger.log('info', ...arguments); }

  log() {  this.logger.log('log', ...arguments); }

  warn() {  this.logger.log('warn', ...arguments); }

  error() {  this.logger.log('error', ...arguments); }
}

export default new Facade();
