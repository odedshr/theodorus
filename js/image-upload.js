app = (typeof app !== 'undefined') ? app : {};
(function imageUploadEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  this.registry.addImage = { attributes: { onclick: addImage.bind(this, false) }};
  this.registry.addImages = { attributes: { onclick: addImage.bind(this, true) }};
  this.registry.replaceImage = { attributes: { onclick: replaceImage.bind(this) }};

  function addImage (isMultiple, evt) {
    uploadImage.call(this, onImagedAdded.bind(this,evt.target.closest('[data-role="imageUploader"]')), isMultiple);
  }

  function onImagedAdded (container, imageData) {
    var previews = container.querySelector('[data-role="previews"]');
    var preview = O.TPL.render({ imagePreview: { src: imageData, status: 'added' }});
    O.DOM.append(previews, preview);
    var allRemoveButtons = previews.querySelectorAll('[data-register]');
    this.registerChildrenOf(previews);
  }

  function replaceImage (evt) {
    uploadImage(evt.target);
  }

  function uploadImage (target, isMultiple) {
    var field = O.DOM.create('input',{
      type: 'file',
      accept: 'image/*'
    });
    if (isMultiple) {
      field.setAttribute('multiple','true');
    }
    field.onchange = onUploadImageSelected.bind(this, target);
    field.click();

    return false;
  }

  function onUploadImageSelected (target, evt) {
    var fileReader, file, files = evt.target.files, i, count = files.length;
    for (i = 0; i < count; i++) {
      file = files[i];
      fileReader = new FileReader();
      fileReader.onload = onUploadImageLoaded.bind(this, target);
      fileReader.readAsDataURL(file);
    }

    return false;
  }

  function onUploadImageLoaded (target, evt) {
    try {
      var imageData = evt.target.result;
      var rect = (typeof target === 'function') ? { width: false, height: false } : target.getBoundingClientRect();
      resizeImage.call (this, imageData, rect.width, rect.height, onUploadImageResized.bind(this,target));
    }
    catch (err) {
      this.log(err.message, this.logType.error);
    }


    return false;
  }

  function onUploadImageResized (target, data) {
    if (typeof target === 'function') {
      target(data);
    } else {
      target.src = data;
      target.setAttribute('data-dirty',true);
      document.querySelector('[data-register="imageRemove"][data-target="'+target.id+'"]').removeAttribute('disabled');
    }
  }

  //==================================/
  //TODO: hasImage to show 'original'
  //TODO: remove button only is image.src has content;
  this.registry.removeImage = { attributes: { onclick: onRemoveImage.bind(this) }};
  function onRemoveImage (evt) {
    var dBtn = evt.target;
    var dImg = O.ELM[dBtn.getAttribute('data-target')];
    dImg.removeAttribute('src');
    dImg.setAttribute('data-dirty', 'true');
    dBtn.setAttribute('disabled','disabled');
    return false;
  }

  this.registry.resetImage = { attributes: { onclick: onResetImage.bind(this) }};
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
    if (maxWidth === false) {
      maxWidth = imageObj.width;
    }
    if (maxHeight === false) {
      maxHeight = imageObj.height;
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
    } else if (imageObj.height > maxHeight) {
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
  this.registry.removeAttachment = { attributes: { onclick: removeAttachment.bind(this) }};

  function removeAttachment (evt) {
    var dImg = evt.target.closest('[data-role="attachment"]');
    if (dImg.getAttribute('data-status') === 'existing') {
      dImg.setAttribute('data-status','removed');
    } else {
      O.DOM.remove(dImg);
    }
  }
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
