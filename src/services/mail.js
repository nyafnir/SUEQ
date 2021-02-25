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
    return transport.sendMail(
        {
            from: mail.from,
            to,
            subject: mail.subject,
            html,
        },
        (error) => {
            if (error) {
                log.error('При отправке письма произошла ошибка!', error);
            }
        }
    );
};

module.exports = {
    send,
};
