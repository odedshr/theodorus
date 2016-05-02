app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};
  this.registry.communityAddPage = { preprocess : registerCreateCommunityForm.bind(this) };
  this.registry.frmAddCommunity = { attributes: { onsubmit:  onAddSubmitted.bind(this) } };

  function registerCreateCommunityForm (dElm, callback) {
    if (!this.isAuthenticated()) {
      history.back ();
      callback ( {} );
      return false;
    }

    this.api.async([
        this.api.getMyMemberships.bind(this),
        this.api.getAllUserImages.bind(this)
      ],
      onCommunityAddDataLoaded.bind(this,callback));
  }

  function onCommunityAddDataLoaded (callback, data) {
    var memberships = data.getMyMemberships.memberships;
    var maxName = '', maxCount = 0;
    var count = {};
    var i = memberships.length;
    while (i--) {
      var name = memberships[i].name;
      var nameCount = count[name];
      nameCount = (count[name] === undefined) ? 1 : nameCount + 1;
      count[name] = nameCount;
      if (nameCount >= maxCount) {
        maxName = name;
        maxCount = nameCount;
      }
    }
     callback({
       founderName : maxName,
       hasImage: false,
       profileImage: '',
       images : this.getImageList (data.getAllUserImages.images, undefined)
     });
  }

  function onAddSubmitted (evt) {
    var form = evt.target;
    var data = this.getFormFields (form);
    //TODO: validate input
    if (form.getAttribute('data-status') !== 'sending') {
      form.setAttribute('data-status','sending');
      this.api.addCommunity({
        community: { name : data.name, description: data.description },
        founder: { name: data.founderName },
        founderImage: O.ELM.profileImagePreview.src
      }, onCommunityAdded.bind(this, form));
    }

    return false;
  }

  function onCommunityAdded (form, response) {
    form.setAttribute('data-status','');
    if (response instanceof Error || !response) {
      this.notify ({
        notifySystem : { message: O.TPL.translate ('notify.failedToAddCommunity'), status:'error' }
      });
      this.log(response, this.logType.debug);
    } else {
      this.updateURL ('community:'+response.community.id+'/');
    }
  }

  //=================================// community name field
  this.registry.uniqueCommunityName = { attributes: { onchange: onCommunityNameChange.bind(this) }};

  function onCommunityNameChange (evt) {
    var dField = evt.target;
    this.setValidationMessage (dField, O.TPL.translate('message.checkingIfNameBeingUsed'));
    if (dField.value.length > 0) {
      this.api.communityExists({ community: { name: dField.value } } , onCommunityExistsChecked.bind(this,dField));
    } else {
      this.setValidationMessage (dField, O.TPL.translate('message.thisFieldIsRequired'));
    }

  }

  function onCommunityExistsChecked (dField,response) {
    this.setValidationMessage (dField, response.exists ? O.TPL.translate('message.namedAlreadyBeingUsed'): '');
  }

return this;}).call(app);
