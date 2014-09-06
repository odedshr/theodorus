// http://blog.nodeknockout.com/post/34641712180/sending-email-from-node-js
(function MailProcessClosure() {
    var io = null,
        mailer = (typeof mailer !== "undefined") ? mailer : require("nodemailer"),
        MailProcess = (function () {
        return {
            smtpTransport : false,
            defaultRecepient : false,

            init : function init (ioFunctions) {
                io = ioFunctions;

                var appName = io.vars("application_name", true);

                this.smtpTransport = mailer.createTransport("SMTP",{
                    service: io.vars(appName+"_MAIL_SERVICE", true),
                    auth: {
                        user: io.vars(appName+"_MAIL_USER",true),
                        pass: io.vars(appName+"_MAIL_PASSWORD",true)
                    }
                });
                this.defaultRecepient = io.vars(appName+"_MAIL_USER",true);
                return this.methods;
            },

            mail : function mail (input,callback) {
                if (!input.emailTo) {
                    input.emailTo = this.defaultRecepient;
                }
                if (!input.emailTemplate) {
                    callback("missing-parameters");
                } else {
                    this.smtpTransport.sendMail({
                        "to": input.emailTo, // comma separated list of receivers
                        "subject": io.xslt({"mail-subject": { "@label": input.emailTemplate }}),
                        "html": io.xslt({mail: { "@type": input.emailTemplate, "data": input.emailData }}),
                        "generateTextFromHTML": true
                    }, function(error, response){
                        if(error){
                            callback(error);
                        }else{
                            callback("Message sent: " + response.message);
                        }
                    });
                }
            },

            mailFromSession : function mailFromSession (session,callback) {
                this.mail(session.input, callback);
            }
        }
    }());

    MailProcess.methods = [
        {"method":"PUT",   "url":"/mail", "handler":MailProcess.mailFromSession.bind(MailProcess)}
    ];

    MailProcess.pipes = [];

    if (typeof exports !== "undefined") {
        exports.mail = MailProcess.mail.bind(MailProcess);
        exports.init = MailProcess.init.bind(MailProcess);
    }

})();