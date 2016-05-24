(function postEnclosure() {
  this.registry = this.registry || {};

  this.getPostLengthString = (function getPostLengthString(content, maxLength) {
    return maxLength > 0 ?
      (this.countWords(content) + '/' + Math.abs(maxLength) + ' ' +
        O.TPL.translate('label.words')) :
      (this.countCharacters(content) + '/' + Math.abs(maxLength) + ' ' +
        O.TPL.translate('label.characters'));
  }).bind(this);

  this.registry.postContent = { attributes: {
    onkeyup: updateCount.bind(this) }
  };
  function updateCount(evt) {
    var field = evt.target;
    var value = field.value;
    var counter = field.closest('[data-count]');
    var countValue = counter.getAttribute('data-count');
    counterContent = countValue.substr(countValue.indexOf('/'));
    var maxValue = +countValue.replace(/\D/g, '');
    var newValue = (countValue.indexOf(O.TPL.translate('label.words')) > -1) ?
      this.countWords(value) : this.countCharacters(value);
    counter.setAttribute('data-count', newValue + counterContent);
    if (newValue > maxValue) {
      counter.setAttribute('data-error', O.TPL.translate('Errors.tooLong'));
      field.setAttribute('data-valid', false);
    } else {
      counter.removeAttribute('data-error');
      field.setAttribute('data-valid', true);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  this.registry.editTopic = { attributes: { onclick:
    toggleEditMode.bind(this, 'topic') } };

  this.registry.editOpinion = { attributes: { onclick:
    toggleEditMode.bind(this, 'opinion') } };

  this.registry.editComment = { attributes: {
    onclick: toggleEditMode.bind(this, 'comment') } };

  function toggleEditMode(postType, evt) {
    var dPost = evt.target.closest('[data-type="' + postType + '"]');
    var dContent = dPost.querySelector('.js-content');
    var dForm = dPost
      .querySelector('[data-register="frmSet' + titlize(postType) + '"]');
    if (dContent.getAttribute('data-hidden') === 'true') {
      dForm.setAttribute('data-hidden', 'true');
      dContent.removeAttribute('data-hidden');
    } else {
      dContent.setAttribute('data-hidden', 'true');
      dForm.removeAttribute('data-hidden');
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  function onAttributeUpdateClicked(attribute, evt) {
    var dElm = evt.target.closest('[data-register]');
    var subject = dElm.closest('.js-item[data-type][data-id]');
    if (dElm.getAttribute('data-value') === 'true') {
      attribute = 'un' + attribute;
    }

    this.api.setAttribute(subject.getAttribute('data-type'),
                          subject.getAttribute('data-id'),
                          attribute,
                          onAttributeUpdate.bind(this, dElm, attribute));
  }

  function onAttributeUpdate(dElm, attribute, output) {
    dElm.setAttribute('data-value', output.viewpoint[attribute]);
    var dCount = O.ELM[''.concat(output.subjectType, '_', output.subjectId, '_',
      output.attribute, '_count')];
    if (dCount !== undefined) {
      dCount.innerHTML = output.count;
    }
  }

  this.registry.endorse = { attributes: { onclick:
    onAttributeUpdateClicked.bind(this, 'endorse') } };
  this.registry.follow = { attributes: { onclick:
    onAttributeUpdateClicked.bind(this, 'follow') } };
  this.registry.read = { attributes: { onclick:
    onAttributeUpdateClicked.bind(this, 'read') } };

  //////////////////////////////////////////////////////////////////////////////

  // gets a map of authors and adds them the url
  this.addImagesToAuthors = (function addImagesToAuthors(authors) {
    var id;
    var author;
    var authorIds = Object.keys(authors);

    for (var i = 0, length = authorIds.length; i < length; i++) {
      this.addImageToMember(authors[authorIds[i]]);
    }
  }).bind(this);

  this.addImageToMember = (function addImageToMember (member) {
    member.image = (!!member.hasImage) ? this.api.getProfileImageURL(member.id) : '';
  }).bind(this);

  //////////////////////////////////////////////////////////////////////////////

  this.getAttachmentsURL = (function getAttachmentsURL(items) {
    if (!!items) {
      for (var i = 0, length = items.length; i < length; i++) {
        items[i] = {
          id: items[count],
          src: this.api.getAttachmentURL(items[count]),
          status: 'existing'
        };
      }
      return items;
    }

    return [];
  }).bind(this);
  //--------------------------------------------------------------------------//
  this.getAttachedImages = (function getAttachedImages(form) {
    var dImgs = form.querySelectorAll('[data-role="attachment"][data-status="added"]');
    var i, imageCount = dImgs.length, images = [];
    for (i = 0; i < imageCount; i++) {
      images[i] = dImgs[i].querySelector('img').src;
    }
    return images;
  }).bind(this);

  //--------------------------------------------------------------------------//
  this.getDetachedImages = (function getAttachedImages(form) {
    var dImgs = form.querySelectorAll('[data-role="attachment"][data-status="removed"]');
    var i, imageCount = dImgs.length, images = [];
    for (i = 0; i < imageCount; i++) {
      images[i] = dImgs[i].getAttribute('data-id');
    }
    return images;
  }).bind(this);

  //////////////////////////////////////////////////////////////////////////////

  function titlize(postType) {
    return postType.substr(0, 1).toUpperCase() + postType.substr(1);
  }

  this.htmlize = (function htmlize(string) {
    return marked(string).replace(/(^|\W)(#[a-z\d][\w-]*)/ig,'$1<span class="tag">$2</span>');
  }).bind(this);

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
