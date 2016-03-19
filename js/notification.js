app = (typeof app !== 'undefined') ? app : {};
(function notificationEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.notify = (function notify (data) {
    var dNotifications = O.ELM.notifications;
    if (dNotifications === undefined) {
      dNotifications = O.ELM.appContainer;
    }

    O.DOM.append(dNotifications,O.TPL.render(data));
    O.ELM.refresh();
    this.registerChildren(dNotifications.querySelectorAll('[data-register]:not(.js-registered)'));
  }).bind(this);

  //==========================

  this.registry.closeNotification = { attributes: { onclick: closeNotifcation.bind(this)}} ;
  function closeNotifcation (evt) {
    O.DOM.remove(evt.target.closest('.notification'));
    return false;
  }

return this;}).call(app);
