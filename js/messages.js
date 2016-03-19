app = (typeof app !== 'undefined') ? app : {};
(function bugReportEnclosure() {
  'use strict';
  this.registry = this.registry || {};

  this.registry.messagesPage = { preprocess: loadMessages };

  function loadMessages (dElm, callback) {
    document.title = O.TPL.translate('title.messages');
    callback();
  }

return this;}).call(app);
