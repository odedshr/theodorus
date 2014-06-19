// http://blog.nodeknockout.com/post/34641712180/sending-email-from-node-js

var io = null,
    mailer = (typeof mailer !== "undefined") ? mailer : require("nodemailer");
    MailProcess = (function () {
    return {
        smtpTransport : mailer.createTransport("SMTP",{
            service: process.env.THEODORUS_MAIL_SERVICE,
            auth: {
                user: process.env.THEODORUS_MAIL_USER,
                pass: process.env.THEODORUS_MAIL_PASSWORD
            }
        }),

        init : function init (ioFunctions) {
            io = ioFunctions;

            var methods = []; //I'm using push because of an annoying compiler warning
            methods.push({"method":"PUT",   "url":"/mail",        "handler":MailProcess.mail.bind(MailProcess)});
            return methods;
        },

        mail : function mail (session,callback) {
            var input = session.input || {} ;

            if (!input.emailTo) {
                input.emailTo = process.env.THEODORUS_MAIL_USER;
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
        }
    }
}());

if (typeof exports !== "undefined") {
    exports.init = MailProcess.init.bind(MailProcess);
}