const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

function send(to, html) {
    transport.sendMail(
        {
            from: process.env.MAIL_FROM,
            to,
            subject: process.env.MAIL_SUBJECT,
            html,
        },
        function (error, info) {
            if (error) {
                console.error(error);
            } else {
                console.info(info);
            }
        }
    );
}

module.exports.send = send;
