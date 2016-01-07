// http://blog.nodeknockout.com/post/34641712180/sending-email-from-node-js
(function MailProcessClosure() {
    if (typeof exports !== "undefined") {
        var io = null,
            mailer = (typeof mailer !== "undefined") ? mailer : require("nodemailer"),
            smtpConnectionConfig = false,
            defaultRecepient = false,

            MailProcess = (function () {
                return {
                    init : function init (ioFunctions) {
                        io = ioFunctions;

                        var appName = io.vars("application_name", true);

                        defaultRecepient = io.vars(appName+"_MAIL_USER",true);
                        smtpConnectionConfig = {
                            service: io.vars(appName+"_MAIL_SERVICE", true),
                            auth: {
                                user: io.vars(appName+"_MAIL_USER",true),
                                pass: io.vars(appName+"_MAIL_PASSWORD",true)
                            }};

                        return this;
                    },

                    mail : function mail (input,callback) {
                        if (!input.emailTo) {
                            input.emailTo = defaultRecepient;
                        }
                        if (!input.emailTemplate) {
                            throw new Error ("missing-parameters-emailTemplate");
                        } else {
                            mailer.createTransport(smtpConnectionConfig).sendMail({
                                "from": defaultRecepient,
                                "to": input.emailTo, // comma separated list of receivers
                                "subject": io.xslt({"mail-subject": { "@label": input.emailTemplate }}),
                                "html": io.xslt({mail: { "@type": input.emailTemplate, "data": input.emailData }}),
                                "generateTextFromHTML": true
                                }, callback);
                        }
                    }
                };
            }());

        exports.mail = MailProcess.mail.bind(MailProcess);
        exports.init = MailProcess.init.bind(MailProcess);
    }

})();