app = (typeof app !== 'undefined') ? app : {};
(function bugReportEnclosure() {
  'use strict';
  this.registry = this.registry || {};

  ////////////////////////////////////////////////////////////////////////////////
  this.registry.mePage = { preprocess: UserProfileCompiler.bind(this) };
  function UserProfileCompiler (dElm, callback) {
    var user = this.state.user,
        birthDate = this.state.user.birthDate,
        output = { birthDate: !!birthDate ? birthDate.substr(0,10).replace(/\//g,'-') : '' };
    switch (user.gender) {
      case 'undefined': output.isGenderUndefined = true; break;
      case 'male': output.isGenderMale = true; break;
      case 'female': output.isGenderFemale = true; break;
    }
    callback(output);
  }

  //----------------------------------------------------------------------------------------------//

  this.registry.frmUserProfile = { attributes: { onsubmit:  UserProfileSubmitter.bind(this) } };
  function UserProfileSubmitter (evt) {
    var form = evt.target;
    var data = this.getFormFields (form);
    //TODO: validate input
    if (form.getAttribute('data-status') !== 'sending') {
      form.setAttribute('data-status','sending');
      try {
        this.api.setUserProfile ( { user: {
            birthDate: new Date (data.birthDate.replace(/-/g,'/')),
            gender: data.gender
        }}, SavedUserNotification.bind(this, form));
      }
      catch (err) {
        console.log(err);
      }
    }

    return false;
  }

  function SavedUserNotification (form, response) {
    form.removeAttribute('data-status');
    if (response instanceof Error) {
      this.notify ({
        notifySystem : { message: O.TPL.translate ('notify.failedToSave'), status:'error' }
      });
      this.log(response,this.logType.debug);
    } else {
      this.state.user = response.user;
      this.notify ({
        notifySystem : { message: O.TPL.translate ('notify.saveSuccess'), status:'success' }
      });
    }
  }
  ////////////////////////////////////////////////////////////////////////////////

  return this;
}).call(app);
