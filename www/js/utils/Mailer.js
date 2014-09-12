// http://blog.nodeknockout.com/post/34641712180/sending-email-from-node-js
(function MailProcessClosure() {
    if (typeof exports !== "undefined") {
        var io = null,
            mailer = (typeof mailer !== "undefined") ? mailer : require("nodemailer"),
            MailProcess = (function () {
                return {
                    smtpConnectionConfig: false,
                    smtpTransport : false,
                    defaultRecepient : false,

                    init : function init (ioFunctions) {
                        io = ioFunctions;

                        var appName = io.vars("application_name", true);

                        this.defaultRecepient = io.vars(appName+"_MAIL_USER",true);
                        this.smtpConnectionConfig = {
                            service: io.vars(appName+"_MAIL_SERVICE", true),
                            auth: {
                                user: io.vars(appName+"_MAIL_USER",true),
                                pass: io.vars(appName+"_MAIL_PASSWORD",true)
                            }};
                        return this;
                    },

                    mail : function mail (input,callback) {
                        if (!input.emailTo) {
                            input.emailTo = this.defaultRecepient;
                        }
                        if (!input.emailTemplate) {
                            throw new Error ("missing-parameters-emailTemplate");
                        } else {
                            mailer.createTransport(this.smtpConnectionConfig).sendMail({
                                "from": this.defaultRecepient,
                                "to": input.emailTo, // comma separated list of receivers
                                "subject": io.xslt({"mail-subject": { "@label": input.emailTemplate }}),
                                "html": io.xslt({mail: { "@type": input.emailTemplate, "data": input.emailData }}),
                                "generateTextFromHTML": true
                            }, function(error, response){
                                callback(error ? error : response);
                            });
                        }
                    }
                };
            }());

        exports.mail = MailProcess.mail.bind(MailProcess);
        exports.init = MailProcess.init.bind(MailProcess);
    }

})();