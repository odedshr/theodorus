app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  //=================================// Community Settings
  this.registry.communitySettingsPage = { preprocess: registerCommunitySettingsPage.bind(this) };

  function registerCommunitySettingsPage (dElm, callback) {
    document.title = O.TPL.translate('title.communitySettings');
    var communityId = this.state.community;
    if (communityId !== undefined && communityId.length > 0) {
      this.api.getCommunity (communityId, onCommunitySettingsDataLoaded.bind(this,callback));
    } else {
      this.updateURL('communities','');
    }
  }

  function onCommunitySettingsDataLoaded (callback, communityData) {
    this.state.communityJSON = communityData;
    if ((communityData.membership === undefined) || (communityData.membership.status !== 'active')) {
      this.updateURL('community:'+communityData.id+'/');
      return;
    }
    document.title = ''.concat(communityData.name,' ',O.TPL.translate('title.settings'));
    var dataForDisplay  = {
      communityId : communityData.id,
      communityName : communityData.name,
      profileImage: this.api.getProfileImageURL(communityData.membership.id)
    };
    dataForDisplay.memberName = communityData.membership.name;
    dataForDisplay.email = this.state.email;
    callback(dataForDisplay);
  }

  this.registry.frmMembershipSettings = { attributes: { onsubmit: onSave.bind(this) }};

  function onSave (evt) {
    var profileImage = O.ELM.profileImagePreview;
    if (profileImage.getAttribute('data-dirty') === 'true') {
      this.api.updateProfileImage(this.state.communityJSON.membership.id,{ image: profileImage.src },this.simplyReturn);
    }
    try {
      var data = this.getDirtyFormFields(evt.target);
      if (Object.keys(data).length > 0) {
        this.api.updateMembership(this.state.communityJSON.membership.id, data, this.updateURL.bind({},'community:'+this.state.community+'/'));
      } else {
        this.updateURL ('community:'+this.state.community+'/');
      }
    }
    catch (err) {
      if (err.errors.length) {
        var count = err.errors.length;
        while (count--) {
          console.log(err.errors);
        }
      }
    }
    return false;
  }

  //=================================// member name field
  this.registry.uniqueMemberName = { attributes: { onchange: onMemberNameChange.bind(this) }};

  function onMemberNameChange (evt) {
    var dField = evt.target;
    this.setValidationMessage (dField, O.TPL.translate('message.checkingIfNameBeingUsed'));
    if (dField.value.length > 0) {
      this.api.membershipExists(this.state.community, dField.value, onMemberExistsChecked.bind(this,dField));
    } else {
      this.setValidationMessage (dField, O.TPL.translate('message.thisFieldIsRequired'));
    }

  }

  function onMemberExistsChecked (dField,response) {
    this.setValidationMessage (dField, response ? O.TPL.translate('message.namedAlreadyBeingUsed'): '');
  }

return this;}).call(app);
