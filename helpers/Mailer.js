;(function MailerClosure() {
  'use strict';

  var nodemailer = require('nodemailer');

  var Errors = require('../helpers/Errors.js');
  var log = require('../helpers/logger.js');
  var transporter, files;

  function init (mailConfiguration, fileMananger) {
    if (mailConfiguration !== undefined) {
      log('configuring mailer to [' + mailConfiguration +']');
      transporter = nodemailer.createTransport(mailConfiguration);
    }
    if (fileMananger !== undefined) {
      files = fileMananger;
    }

    return {
      send: send
    };
  }

  function send (To, From, Subject, text, html, callback) {
    if (To === undefined) {
      callback (Errors.missingInput('mail.to'));
    }
    if (Subject === undefined) {
      callback (Errors.missingInput('mail.subject'));
    }
    var mailOptions = {
      from: ''.concat('Theodorus',(From && From.length > 0) ? ' on behalf of '+From: '',' <bot@minsara.co.il>'),
      to: To,
      subject: Subject,
      text: text,
      html: html
    };

    log('mailing ' + To + ': '+ Subject);

    if (To.indexOf('@test.suite') > -1 && files !== undefined) {
      files.set(To+'-'+Subject.replace(/\s/g,'_')+'.json', JSON.stringify(mailOptions));
      callback({output:'stored'});
    } else if (transporter !== undefined) {
      transporter.sendMail(mailOptions, onMailSent.bind({},callback));
    } else {
      log(JSON.stringify('variable THEODORUS_MAIL not set'));
    }
    if (transporter !== undefined && files !== undefined) {
      log(JSON.stringify(mailOptions));
    }
  }

  function onMailSent (callback, error, info) {
    callback (error ? new Error (error) : {output:'sent', details: info});
  }

  module.exports = init;
})();