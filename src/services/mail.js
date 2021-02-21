const nodemailer = require('nodemailer');
const config = require('../config');

const transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    auth: {
        user: config.mail.user,
        pass: config.mail.password,
    },
});

const send = (to, html) => {
    transport.sendMail(
        {
            from: config.mail.from,
            to,
            subject: config.mail.subject,
            html,
        },
        (error, info) => {
            if (error) {
                console.error(error);
            } else {
                console.info(info);
            }
        }
    );
};

module.exports.send = send;
