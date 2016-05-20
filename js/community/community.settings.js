(function CommunitySettingsEnclosure() {
  'use strict';

  this.registry = this.registry || {};

  //=================================// Community Settings
  this.registry.communitySettingsPage = { preprocess: RegisterCommunitySettingsPage.bind(this) };

  function RegisterCommunitySettingsPage (dElm, callback) {
    if (!this.isAuthenticated()) {
      history.back ();
      callback ( {} );
      return false;
    }

    document.title = O.TPL.translate('title.communitySettings');
    var communityId = this.state.community;
    if (communityId !== undefined && communityId.length > 0) {
      this.api.async({
          'getCommunity': this.api.getCommunity.bind(this,communityId),
          'getAllUserImages': this.api.getAllUserImages.bind(this)
        },
        CommunitySettingsDataLoaded.bind(this,callback));
    } else {
      this.updateURL('communities','');
    }
  }

  function CommunitySettingsDataLoaded (callback, data) {
    var community = data.getCommunity.community;
    var membership = data.getCommunity.membership;
    this.state.communityJSON = community;
    this.state.membershipJSON = membership;
    if ((membership === undefined) || (membership.status !== 'active')) {
      this.updateURL('community:'+community.id+'/');
      return;
    }
    document.title = ''.concat(community.name,' ',O.TPL.translate('title.settings'));

    var dataForDisplay  = {
      communityId : community.id,
      communityName : community.name,
      hasImage: membership.hasImage,
      profileImage: membership.hasImage ? this.api.getProfileImageURL(membership.id) : '',
      images : this.getImageList (data.getAllUserImages.images, membership.id)
    };
    dataForDisplay.memberName = membership.name;
    dataForDisplay.email = this.state.email;
    callback(dataForDisplay);
  }

  this.registry.frmMembershipSettings = { attributes: { onsubmit: Save.bind(this) }};

  function Save (evt) {
    var profileImage = O.ELM.profileImagePreview;
    try {
      var data = {
        membership: this.getDirtyFormFields(evt.target)
      };
      data.membershipImage = profileImage.src;
      if (Object.keys(data.membership).length > 0 || profileImage.getAttribute('data-dirty')) {

        this.api.updateMembership(this.state.membershipJSON.id, data, this.updateURL.bind({},'community:'+this.state.community+'/'));
      } else {
        this.updateURL ('community:'+this.state.community+'/');
      }
    }
    catch (err) {
      if (err.errors.length) {
        for (var i = 0, length = err.errors.length; i < length; i++) {
          this.log(err.errors[i], this.logType.error);
        }
      }
    }
    return false;
  }

  //=================================// member name field
  this.registry.uniqueMemberName = { attributes: { onchange: MemberNameChange.bind(this) }};

  function MemberNameChange (evt) {
    var dField = evt.target;
    this.setValidationMessage (dField, O.TPL.translate('message.checkingIfNameBeingUsed'));
    if (dField.value.length > 0) {
      var data = { membership: {
        communityId: this.state.community,
        name: dField.value
      } };
      this.api.membershipExists(data, MemberExistsChecked.bind(this,dField));
    } else {
      this.setValidationMessage (dField, O.TPL.translate('message.thisFieldIsRequired'));
    }

  }

  function MemberExistsChecked (dField,response) {
    this.setValidationMessage (dField, response.exists==='false' ? O.TPL.translate('message.namedAlreadyBeingUsed'): '');
  }

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
