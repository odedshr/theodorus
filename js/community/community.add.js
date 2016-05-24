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
      AddCommunityPageCompiler.bind(this,callback));
  }

  function AddCommunityPageCompiler (callback, data) {
    var memberships = data.getMyMemberships.memberships,
        maxName = '', maxCount = 0,
        count = {},
        user = this.state.user,
        birthDate = user.birthDate,
        gender = user.gender,
        output = {
          founderName : maxName,
          hasImage: false,
          hasGender : (gender === 'male' || gender === 'female'),
          isFemale: gender === 'female',
          profileImage: '',
          images : this.getImageList (data.getAllUserImages.images, undefined)
        };

    for (var i = 0, length = memberships.length; i < length; i++) {
      var name = memberships[i].name;
      var nameCount = count[name];
      nameCount = (count[name] === undefined) ? 1 : nameCount + 1;
      count[name] = nameCount;
      if (nameCount >= maxCount) {
        maxName = name;
        maxCount = nameCount;
      }
    }
    output.founderName = maxName;

    if (birthDate !== undefined) {
      output.hasBirthDate = true;
      output.age = moment().diff(this.state.user.birthDate, 'years');
    }

    callback(output);
  }

  function AddSubmitted (evt) {
    var form = evt.target,
        data = this.getFormFields (form), minAge, maxAge,
        community = { name : data.name, description: data.description };

    if (data.limitGender === true) {
      community.gender = this.state.user.gender;
    }
    if (data.limitAge === true) {
      minAge = +data.minAge;
      if (minAge > 0) {
        community.minAge = minAge;
      }
      maxAge = +data.maxAge;
      if (maxAge > 0) {
        community.maxAge = maxAge;
      }
      if (minAge > 0 && maxAge > 0 && minAge > maxAge) {
        this.notify ({
          notifySystem : { message: O.TPL.translate ('notify.minAgeMustBeSmallerThanMaxAge'), status:'error' }
        });
        return;
      }
    }
    //TODO: validate input
    if (form.getAttribute('data-status') !== 'sending') {
      form.setAttribute('data-status','sending');
      this.api.addCommunity({
        community: community,
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
