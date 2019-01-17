'use strict';

import log from './logger.js';

function tryCatch(func, callback) {
  try {
    func();
  } catch (err) {
    log(err, 'fatal');

    if (typeof callback === 'function') {
      callback(err);
    }
  }
}

export default tryCatch;
