app = (typeof app !== 'undefined') ? app : {};
(function imageUploadEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  this.registry.imageUpload = { attributes: { onclick: onUploadImage.bind(this) }};

  function onUploadImage (evt) {
    var field = document.createElement("input");
    field.setAttribute('type','file');
    field.setAttribute('accept','image/*');
    field.onchange = onUploadImageSelected.bind(this, evt.target);
    field.click();

    return false;
  }

  function onUploadImageSelected (dImg, evt) {
    var file = evt.target.files[0];
    var fileReader = new FileReader();
    fileReader.onload = onUploadImageLoaded.bind(this, dImg);
    fileReader.readAsDataURL(file);

    return false;
  }

  function onUploadImageLoaded (dImg, evt) {
    try {
      var rect = dImg.getBoundingClientRect();
      dImg.src = this.resizeImage(evt.target.result, rect.width, rect.height);
      dImg.setAttribute('data-dirty',true);
    }
    catch (err) {
      this.log(err);
    }

    return false;
  }

return this;}).call(app);
