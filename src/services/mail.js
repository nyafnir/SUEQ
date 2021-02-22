const nodemailer = require('nodemailer');
const { mail } = require('../config');
const { log } = require('../logger');

const transport = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    auth: {
        user: mail.user,
        pass: mail.password,
    },
});

// Отправить письмо на почту "to" с содержанием в формате html
const send = (to, html) => {
    transport.sendMail(
        {
            from: mail.from,
            to,
            subject: mail.subject,
            html,
        },
        (error, info) => {
            if (error) {
                log.error(error);
            } else {
                log.info(info);
            }
        }
    );
};

module.exports.send = send;
