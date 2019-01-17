import nodemailer from 'nodemailer';
import directTransport from 'nodemailer-direct-transport';
import { hostname } from 'os';
import { Errors, colors } from 'groundup';
import logger from './logger.js';

class Mailer {
  //https://nodemailer.com/smtp/
  /**
   * 
   * @param {Object} smtpConfig -  { host, port, secure, auth:{ user, password} }
   * @param {Object} fileMananger - FileMangerInstace 
   */
  constructor({ smtp: smtpConfig, name: appName, appEmail }, fileMananger) {
    this.appName = appName;
    this.appEmail = appEmail;

    if (smtpConfig !== undefined) {
      logger.info(`configuring mailer to ${colors.FgYellow}${config.host}${colors.Reset}`);
    } else {
      logger.warn('configuring mailer to send from local machine (not recommended)');
      // should be the hostname machine IP address resolves to
      smtpConfig = directTransport({ name: hostname() });
    }
    this.transporter = nodemailer.createTransport(smtpConfig);
  
    this.files = fileMananger;
  }

  send(to, from, subject, text, html) {
    return new Promise((resolve, reject) => {
      if (to === undefined) {
        reject(new Errors.MissingInput('mail.to'));
      }

      if (subject === undefined) {
        reject(new Errors.MissingInput('mail.subject'));
      }

      const onBehalf = (from && from.length > 0) ? `on behalf of ${from}` : '',
        mailOptions = {
        from: `${this.appName}${onBehalf} <${this.appEmail}>`,
        to,
        subject,
        text,
        html
      };

      if (to.indexOf('@test.suite') > -1 && files !== undefined) {
        files.set(`${to}-${subject.replace(/\s/g, '_')}.json`, JSON.stringify(mailOptions));
        resolve({ output: 'stored' });
      } else if (this.transporter !== undefined) {
        this.transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            reject(new Errors.System(error));
          }
          resolve({ output: 'sent', details: info });
        });
      } else {
        logger.warn(JSON.stringify('variable THEODORUS_MAIL not set'));
        logger.info(JSON.stringify(mailOptions));
        resolve({ output: 'not-sent', details: info });
      }
    })
    .catch(err => err);
  }
}

export default Mailer;