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
      resizeImage.call (this, evt.target.result, rect.width, rect.height, onUploadImageResized.bind(this,dImg));
    }
    catch (err) {
      this.log(err);
    }

    return false;
  }

  function onUploadImageResized (dImg, data) {
    dImg.src = data;
    dImg.setAttribute('data-dirty',true);
    document.querySelector('[data-register="imageRemove"][data-target="'+dImg.id+'"]').removeAttribute('disabled');
  }

  //==================================/
  //TODO: hasImage to show 'original'
  //TODO: remove button only is image.src has content;
  this.registry.imageRemove = { attributes: { onclick: onRemoveImage.bind(this) }};
  function onRemoveImage (evt) {
    var dBtn = evt.target;
    var dImg = O.ELM[dBtn.getAttribute('data-target')];
    dImg.removeAttribute('src');
    dImg.setAttribute('data-dirty', 'true');
    dBtn.setAttribute('disabled','disabled');
    return false;
  }

  this.registry.imageReset = { attributes: { onclick: onResetImage.bind(this) }};
  function onResetImage (evt) {
    var dImg = O.ELM[evt.target.getAttribute('data-target')];
    dImg.src = this.api.getProfileImageURL(this.state.membershipJSON.id);
    dImg.setAttribute('data-dirty', 'false');
    document.querySelector('[data-register="imageRemove"][data-target="'+dImg.id+'"]').removeAttribute('disabled');
    return false;
  }
  //==================================/
  this.registry.copyImage = { attributes: { onclick: copyImage.bind(this) }};

  function copyImage (evt) {
    var source = evt.target;
    var target = O.ELM[source.getAttribute('data-target')];
    var rect = target.getBoundingClientRect();
    resizeImage.call (this, source.src, rect.width, rect.height, onUploadImageResized.bind({},target));
    return false;
  }

  //==================================/
  function resizeImage (imgDataURL, maxWidth, maxHeight, callback)
  {
    // load image from data url
    var imageObj = new Image();
    imageObj.setAttribute('crossOrigin', 'anonymous');
    imageObj.onload = resizeImageOnImageLoaded.bind(this, imageObj, maxWidth, maxHeight, callback);
    imageObj.src = imgDataURL;
  }

  function resizeImageOnImageLoaded (imageObj, maxWidth, maxHeight, callback) {
    if (imageObj.width > 1000 || imageObj.height > 1000) {
      this.log(O.TPL.translate('error.imageTooBig').replace('[width]',1000).replace('[height]',1000),this.logType.error);
      return;
    }
    var ratio = 1;
    var canvas = document.createElement('canvas');
    canvas.style.display='none';
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    context.drawImage(imageObj, 0, 0);

    var canvasCopy = document.createElement('canvas');
    canvasCopy.style.display='none';
    document.body.appendChild(canvasCopy);
    var ctx = canvas.getContext('2d');
    var copyContext = canvasCopy.getContext('2d');
    if (imageObj.width > maxWidth) {
      ratio = maxWidth / imageObj.width;
    } else if(imageObj.height > maxHeight) {
      ratio = maxHeight / imageObj.height;
    }
    canvasCopy.width = imageObj.width;
    canvasCopy.height = imageObj.height;
    copyContext.drawImage(imageObj, 0, 0);

    var imgWidth = imageObj.width * ratio;
    var imgHeight =  imageObj.height * ratio;
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.drawImage(canvasCopy, (maxWidth - imgWidth)/2, (maxHeight - imgHeight)/2, imgWidth,  imgHeight);
    var dataURL = canvas.toDataURL('image/png');
    document.body.removeChild(canvas);
    document.body.removeChild(canvasCopy);
    callback (dataURL); //dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
  }
  this.resizeImage = resizeImage.bind(this);

  //==================================/

  // membershipIds = getAllUserImages.images
  this.getImageList = function getImageList (membershipIds, currentMembershipId) {
    var imageCount = membershipIds.length;
    var images = [];
    while (imageCount--) {
      var id = membershipIds[imageCount];
      if (id !== currentMembershipId) {
        images.push ( this.api.getProfileImageURL(id) );
      }
    }
    return { image : images };
  };
return this;}).call(app);
