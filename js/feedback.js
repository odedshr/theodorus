app = (typeof app !== 'undefined') ? app : {};
(function bugReportEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.reportBug = { attributes: { onclick : captureCurrentState.bind(this) } };
  this.registry.feedbackPage = { preprocess: initFeedbackPage };

  function initFeedbackPage (dElm, callback) {
    document.title = O.TPL.translate('title.feedback');
    callback();
  }
  function captureCurrentState () {
    var url = location.href;
    html2canvas(document.body, {
      onrendered: function(canvas) {
        window.setTimeout(storePreviousPageData.bind(this,canvas.toDataURL(), url),1);
      }
    });
    return true;
  }

  function storePreviousPageData (canvasData, url) {
    O.ELM.url.value = url;
    O.ELM.image.value = canvasData;
    O.ELM.screenshotSample.src = canvasData;
    O.ELM.screenshotRow.removeAttribute('data-hidden');
  }

  this.registry.frmSendFeedback =  { attributes: {onsubmit : sendFeedback.bind(this) } } ;

  function sendFeedback (evt) {
    try {
      var data = this.getFormFields(evt.detail.target);
      if (!data.feedbackIncludesScreenshot) {
        delete data.image;
      }
      this.api.feedback (data, onFeedbackSent.bind(this));
    }
    catch (exception) {
      this.log (exception, 'debug');
    }

    return false;
  }

  function onFeedbackSent () {
    this.notify({notifySuccessFeedbackSent:{}});
  }

return this;}).call(app);
