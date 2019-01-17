'use strict';

const version = process.env.npm_package_version;

class SystemController {
  ping() {
    return 'pong';
  }

  version() {
    return version;
  }

  getEmail({ email = '' }) {
    return { email };
  }

  getVersion() {
    return { version };
  }
}

export default new SystemController();
