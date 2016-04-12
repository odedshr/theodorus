;(function MailerClosure() {
  'use strict';

  var nodemailer = require('nodemailer');
  var log = require('../helpers/logger.js');
  var transporter;

  function init (mailConfiguration) {
    if (mailConfiguration === undefined) {
      log ('no mail environment variable found :-(');
    } else {
      transporter = nodemailer.createTransport(mailConfiguration);
    }

    return {
      send: send
    };
  }

  function send (To, From, Subject, text, html, callback) {
    var mailOptions = {
      from: ''.concat('Theodorus',(From && From.length > 0) ? ' on behalf of '+From: '',' <bot@minsara.co.il>'),
      to: To,
      subject: Subject,
      text: text,
      html: html
    };

    if (transporter === undefined) {
      callback ('cannot send mail because the mailer wasn\'t configured.\nMake sure you have a \'mail\' environment variable that looks like this smtps://username:password@server');
    } else {
      transporter.sendMail(mailOptions, onMailSent.bind({},callback));
    }
  }

  function onMailSent (callback, error, info) {
    callback (error ? new Error (error) : info);
  }

  module.exports = init;
})();