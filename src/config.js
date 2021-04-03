const dotenv = require('dotenv');

dotenv.config(); // Загружаем файл .env в process.env

module.exports = {
    server: {
        address: process.env.SERVER_ADDRESS,
        port: parseInt(process.env.SERVER_PORT, 10),
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
        sequelize: {
            force: process.env.SEQUELIZE_FORCE.toLowerCase() === 'true',
            alter: process.env.SEQUELIZE_ALTER.toLowerCase() === 'true',
            logging: process.env.SEQUELIZE_LOGGING.toLowerCase() === 'true',
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
    middleware: {
        validate: {
            abortEarly:
                process.env.MIDDLEWARE_VALIDATE_ABORT_EARLY.toLowerCase() ===
                'true',
            allowUnknown:
                process.env.MIDDLEWARE_VALIDATE_ALLOW_UNKNOWN.toLowerCase() ===
                'true',
            stripUnknown:
                process.env.MIDDLEWARE_VALIDATE_STRIP_UNKNOWN.toLowerCase() ===
                'true',
            messages: {
                ru: {
                    'any.required': 'Поле {#label} не указано',
                    'any.invalid': 'Поле {#label} неправильное',
                    'string.min':
                        'Поле {#label} должно содержать минимум {#limit} симв.',
                    'string.max':
                        'Поле {#label} может содержать максимум {#limit} симв.',
                    'string.empty': 'Поле {#label} пустое',
                    'string.base':
                        'Поле {#label} должно быть указано в виде строки',
                    'string.pattern.base': 'Поле {#label} неправильное',
                    'number.empty': 'Поле {#label} пустое!',
                    'number.base':
                        'Поле {#label} должно быть указано в виде числа',
                    'number.integer': 'Поле {#label} должно быть целочисленным',
                    'object.min': 'Должно быть указано хотя бы одно поле!',
                    'email.invalid':
                        'Указан не существующая почта в поле {#label}',
                    'phoneNumber.invalid':
                        'Указан не существующий номер телефона в поле {#label}',
                    'array.unique':
                        'В перечисленных значениях {#label} есть дубликаты',
                },
            },
            errors: {
                labels: false,
                language: 'ru',
            },
        },
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
        passwordReset: {
            secret: process.env.TOKEN_PASSWORD_RESET_SECRET,
            life: parseInt(process.env.TOKEN_PASSWORD_RESET_TIMEOUT_MS, 10),
        },
        emailConfirm: {
            secret: process.env.TOKEN_EMAIL_CONFIRM_SECRET,
            life: parseInt(process.env.TOKEN_EMAIL_CONFIRM_TIMEOUT_MS, 10),
        },
        accountRescue: {
            secret: process.env.TOKEN_ACCOUNT_RESCUE_SECRET,
            life: parseInt(process.env.TOKEN_ACCOUNT_RESCUE_TIMEOUT_MS, 10),
        },
    },
    queues: {
        limits: {
            owner: parseInt(process.env.QUEUES_OWNER_LIMIT, 10),
            member: parseInt(process.env.QUEUES_MEMBER_LIMIT, 10),
            schedules: parseInt(process.env.QUEUES_SCHEDULES_LIMIT, 10),
            holidays: parseInt(process.env.QUEUES_HOLIDAYS_LIMIT, 10),
        },
    },
    regexs: {
        // Проверка: yyyy-mm-dd, yyyy mm dd, yyyy/mm/dd
        // проверяет только что февраль содержит 29 дней и игнорирует високосные года
        // eslint-disable-next-line no-useless-escape
        dateonly: /^\d{4}[\-\/\s]?((((0[13578])|(1[02]))[\-\/\s]?(([0-2][0-9])|(3[01])))|(((0[469])|(11))[\-\/\s]?(([0-2][0-9])|(30)))|(02[\-\/\s]?[0-2][0-9]))$/,
        // Проверка: HH:MM
        // eslint-disable-next-line no-useless-escape
        timeonly: /^([0-9]{2})\:([0-9]{2})$/,
    },
};
