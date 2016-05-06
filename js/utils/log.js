app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  this.logType = {
    'debug': 'debug',
    'system': 'system',
    'community': 'community',
    'message': 'message',
    'score': 'score',
    'error': 'error'
  };
  this.log = (function log (value, type, color) {
    var types = this.logType;
    if (type=== undefined) {
      type = types.system;
    }
    switch (type) {
      case types.debug:
        console.debug(value);
      break;
      case types.system:
        this.notify({notifySystem:{ message: value, status:'info' }});
      break;
      case types.community:
        this.notify({notifyCommunity:{ message: value, status:'info' }});
      break;
      case types.message:
        this.notify({notifyMessage:{ message: value, status:'info' }});
      break;
      case types.score:
        this.notify({notifyScore:{ message: value, status:'info' }});
      break;
      case types.error:
        if (value instanceof Error) {
            console.debug(value);
            value = value.message;
        }
        this.notify({notifySystem:{ message: value, status:'error' }});
      break;
      default:
        if (!this.isProduction) {
          if (color === undefined) {
            console.log(type+': '+ value);
          } else {
            console.log(type+': '+ value, color);
          }
        }
      break;
    }
    return value;
  }).bind(this);

return this;}).call(app);
