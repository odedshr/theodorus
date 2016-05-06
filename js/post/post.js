app = (typeof app !== 'undefined') ? app : {};
(function postEnclosure() {
  this.registry = this.registry || {};

  this.getPostLengthString = (function getPostLengthString (content, maxLength) {
    return maxLength > 0 ?
      (this.countWords(content) + '/' + Math.abs(maxLength) + ' ' + O.TPL.translate('label.words')) :
      (this.countCharacters(content)+ '/' + Math.abs(maxLength) + ' ' + O.TPL.translate('label.characters'));
  }).bind(this);

  this.registry.postContent = { attributes : { onkeyup : updateCount.bind(this) }};
  function updateCount (evt) {
    var field = evt.target;
    var value = field.value;
    var counter = field.closest('[data-count]');
    var counterContent = counter.getAttribute('data-count');
    counterContent = counterContent.substr(counterContent.indexOf('/'));
    var maxValue = +counterContent.replace(/\D/g,'');
    var newValue = (counterContent.indexOf(O.TPL.translate('label.words')) > -1) ? this.countWords(value) : this.countCharacters(value);
    counter.setAttribute ('data-count', newValue + counterContent);
    if (newValue > maxValue) {
      counter.setAttribute('data-error',O.TPL.translate('Errors.tooLong'));
      field.setAttribute('data-valid',false);
    } else {
      counter.removeAttribute('data-error');
      field.setAttribute('data-valid',true);
    }
  }

  function titlize(postType) {
    return postType.substr(0,1).toUpperCase() + postType.substr(1);
  }

  //////////////////////////////////////////////////////////////////////////////

  this.registry.editTopic = { attributes : { onclick :
    toggleEditMode.bind(this, 'topic')
  }};

  this.registry.editOpinion = { attributes : { onclick :
    toggleEditMode.bind(this, 'opinion')
  }};

  this.registry.editComment = { attributes : { onclick :
    toggleEditMode.bind(this, 'comment')
  }};

  function toggleEditMode (postType,evt) {
    var dPost = evt.target.closest('[data-type="'+postType+'"]');
    var dContent = dPost.querySelector('.js-content');
    var dForm = dPost
      .querySelector('[data-register="frmSet' + titlize(postType) + '"]');
    if (dContent.getAttribute('data-hidden') === 'true') {
      dForm.setAttribute('data-hidden','true');
      dContent.removeAttribute('data-hidden');
    } else {
      dContent.setAttribute('data-hidden','true');
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
                          onAttributeUpdate.bind(this,dElm, attribute));
  }

  function onAttributeUpdate (dElm, attribute, output) {
    dElm.setAttribute('data-value',output.viewpoint[attribute]);
    var dCount = O.ELM[''.concat(output.subjectType,'_',output.subjectId,'_',
      output.attribute,'_count')];
    if (dCount !== undefined) {
      dCount.innerHTML = output.count;
    }
  }

  this.registry.endorse = { attributes : { onclick :
    onAttributeUpdateClicked.bind(this, 'endorse' ) } };
  this.registry.follow = { attributes : { onclick :
    onAttributeUpdateClicked.bind(this, 'follow' ) } };
  this.registry.read = { attributes : { onclick :
    onAttributeUpdateClicked.bind(this, 'read' ) } };

  //////////////////////////////////////////////////////////////////////////////

  this.addImagesToAuthors = (function addImagesToAuthors (authors) {
    var id, author, authorIds = Object.keys(authors);
    count = authorIds.length;
    while (count--) {
      id = authorIds[count];
      author = authors[id];
      author.image = (!!author.hasImage) ? this.api.getProfileImageURL(id) : '';
    }
  }).bind(this);

return this;}).call(app);
