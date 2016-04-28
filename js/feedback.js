app = (typeof app !== 'undefined') ? app : {};
(function bugReportEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.sendFeedback = { attributes: { onclick : captureCurrentState.bind(this) } };
  function captureCurrentState () {
    var url = location.href;
    html2canvas(document.body, { onrendered: onCanvasRendered.bind(this) });
    return true;
  }

  function onCanvasRendered (canvas) {
    window.setTimeout(storePreviousPageData.bind(this,canvas.toDataURL(), url),1);
  }

  //////////////////////////////////////////////////////////////////////////////

  this.registry.feedbackPage = { preprocess: initFeedbackPage };

  function initFeedbackPage (dElm, callback) {
    document.title = O.TPL.translate('title.feedback');
    callback();
  }

  function storePreviousPageData (canvasData, url) {
    O.ELM.url.value = url;
    O.ELM.screenshotSample.src = canvasData;
    O.ELM.screenshotRow.removeAttribute('data-hidden');
    this.resizeImage (canvasData, 1280, 1280, gotResizedScreenshot);
  }

  function gotResizedScreenshot(canvasData) {
    O.ELM.image.value = canvasData;
  }

  this.registry.frmFeedback =  { attributes: { onsubmit : sendFeedback.bind(this) } } ;

  function sendFeedback (evt) {
    try {
      var data = this.getFormFields(evt.target);
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
