/* global appName */
;(function eventSystemEnclosure(scope) {
  'use strict';

  function Event() {
    this.constructor.apply(this, arguments);

    this.fire = this.fireEvent.bind(this);
    this.listen = this.listen.bind(this);

    return this;
  }

  Event.prototype = {
    fireEvent: function fireEvent(eventName, details) {
      var event; // The custom event that will be created

      if (document.dispatchEvent) {
        event = new CustomEvent(eventName, { detail: details });
      } else {
        event = document.createEventObject();
        event.eventType = eventName;
      }

      event.eventName = eventName;

      if (document.dispatchEvent) {
        document.dispatchEvent(event);
      } else {
        document.fireEvent('on' + event.eventType, event);
      }
    },

    listen: function listen(eventName, handler) {
      document.addEventListener(eventName, handler);
    }
  };

  scope.event = new Event();

})(window[appName] || module.exports);
