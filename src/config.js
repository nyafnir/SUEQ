const dotenv = require('dotenv');
dotenv.config(); // Загружаем файл .env в process.env

module.exports = {
    server: {
        address: process.env.ADDRESS,
        port: parseInt(process.env.PORT, 10),
        limit: {
            rate: {
                windowMs: parseInt(process.env.LIMIT_RATE_WINDOW_MS, 10),
                max: parseInt(process.env.LIMIT_RATE_MAX_REQUESTS, 10),
                message:
                    'Слишком много запросов, пожалуйста, попробуйте позже.',
            },
            speed: {
                windowMs: parseInt(process.env.LIMIT_SPEED_WINDOW_MS, 10),
                delayAfter: parseInt(process.env.LIMIT_SPEED_DELAY_AFTER, 10),
                delayMs: parseInt(process.env.LIMIT_SPEED_DELAY_MS, 10),
            },
        },
    },
    database: {
        dialect: process.env.DB_DIALECT,
        credentials: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        },
        pool: {
            max: parseInt(process.env.DB_POOL_MAX, 10),
            min: parseInt(process.env.DB_POOL_MIN, 10),
            acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10),
            idle: parseInt(process.env.DB_POOL_IDLE, 10),
        },
        events: {
            accountNotRescueCheck: parseInt(
                process.env.DB_EVENTS_ACCOUNT_NOT_RESCUE_MS,
                10
            ),
            emailNotConfirmCheck: parseInt(
                process.env.DB_EVENTS_EMAIL_NOT_CONFIRM_MS,
                10
            ),
        },
    },
    mail: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT, 10),
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASSWORD,
        from: process.env.MAIL_FROM,
        subject: process.env.MAIL_SUBJECT,
    },
    hash: {
        saltRounds: parseInt(process.env.HASH_SALT_ROUNDS, 10),
    },
    tokens: {
        access: {
            secret: process.env.TOKEN_ACCESS_SECRET,
            life: parseInt(process.env.TOKEN_ACCESS_LIFE, 10),
        },
        refresh: {
            secret: process.env.TOKEN_REFRESH_SECRET,
            life: parseInt(process.env.TOKEN_REFRESH_LIFE, 10),
        },
        passwordResetTimeout: parseInt(
            process.env.TOKEN_PASSWORD_RESET_TIMEOUT_MS,
            10
        ),
        emailConfirmedTimeout: parseInt(
            process.env.TOKEN_EMAIL_CONFIRMED_TIMEOUT_MS,
            10
        ),
        accountRescueTimeout: parseInt(process.env.TOKEN_RESCUE_TIMEOUT_MS, 10),
    },
    queues: {
        owner: {
            limit: parseInt(process.env.QUEUES_OWNER_LIMIT, 10),
        },
        member: {
            limit: parseInt(process.env.QUEUES_MEMBER_LIMIT, 10),
        },
        schedules: {
            limit: parseInt(process.env.QUEUES_SCHEDULES_LIMIT, 10),
        },
        holidays: {
            limit: parseInt(process.env.QUEUES_HOLIDAYS_LIMIT, 10),
        },
    },
    regexs: {
        // yyyy-mm-dd, yyyy mm dd, yyyy/mm/dd
        // проверяет только что февраль содержит 29 дней. игнорирует високосные года
        // eslint-disable-next-line no-useless-escape
        dateonly: /^\d{4}[\-\/\s]?((((0[13578])|(1[02]))[\-\/\s]?(([0-2][0-9])|(3[01])))|(((0[469])|(11))[\-\/\s]?(([0-2][0-9])|(30)))|(02[\-\/\s]?[0-2][0-9]))$/,
        // eslint-disable-next-line no-useless-escape
        timeonly: /^([0-9]{2})\:([0-9]{2})$/, // HH:MM
    },
};
