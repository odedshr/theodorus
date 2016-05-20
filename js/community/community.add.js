(function CommunityAddEnclosure() {
  'use strict';

  this.registry = this.registry || {};
  this.registry.communityAddPage = { preprocess : RegisterCreateCommunityForm.bind(this) };
  this.registry.frmAddCommunity = { attributes: { onsubmit:  AddSubmitted.bind(this) } };

  function RegisterCreateCommunityForm (dElm, callback) {
    if (!this.isAuthenticated()) {
      history.back ();
      callback ( {} );
      return false;
    }

    this.api.async({
        'getMyMemberships': this.api.getMyMemberships.bind(this),
        'getAllUserImages': this.api.getAllUserImages.bind(this)
      },
      CommunityAddDataLoaded.bind(this,callback));
  }

  function CommunityAddDataLoaded (callback, data) {
    var memberships = data.getMyMemberships.memberships;
    var maxName = '', maxCount = 0;
    var count = {};
    for (var i = 0, length = memberships.length; i < length; i--) {
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

  function AddSubmitted (evt) {
    var form = evt.target;
    var data = this.getFormFields (form);
    //TODO: validate input
    if (form.getAttribute('data-status') !== 'sending') {
      form.setAttribute('data-status','sending');
      this.api.addCommunity({
        community: { name : data.name, description: data.description },
        founder: { name: data.founderName },
        founderImage: O.ELM.profileImagePreview.src
      }, CommunityAdded.bind(this, form));
    }

    return false;
  }

  function CommunityAdded (form, response) {
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
  this.registry.uniqueCommunityName = { attributes: { onchange: CommunityNameChange.bind(this) }};

  function CommunityNameChange (evt) {
    var dField = evt.target;
    this.setValidationMessage (dField, O.TPL.translate('message.checkingIfNameBeingUsed'));
    if (dField.value.length > 0) {
      this.api.communityExists({ community: { name: dField.value } } , CommunityExistsChecked.bind(this,dField));
    } else {
      this.setValidationMessage (dField, O.TPL.translate('message.thisFieldIsRequired'));
    }

  }

  function CommunityExistsChecked (dField,response) {
    this.setValidationMessage (dField, response.exists ? O.TPL.translate('message.namedAlreadyBeingUsed'): '');
  }

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
