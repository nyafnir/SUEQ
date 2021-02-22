const Joi = require('joi');
const router = require('express').Router();
const db = require('../models');
const mail = require('../services/mail');
const security = require('../services/security');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const Response = require('../response');
const { server, tokens } = require('../config');
const { secondsFormattedHMS } = require('../services/utils');

//#region Схемы валидации

const forgotPasswordSchema = (request, response, next) => {
    const schema = Joi.object({
        email: Joi.string()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .required()
            .messages({
                'any.required': 'Почта не указана!',
                'string.empty': 'Поле почты пустое!',
                'string.base': 'Почта должна быть указана в виде строки!',
                'string.email':
                    'Указанной почты не существует или она запрещена нашими правилами!',
            }),
    });
    validate(request.body, next, schema);
};

const resetPasswordSchema = (request, response, next) => {
    const schema = Joi.object({
        userId: Joi.number().integer().required().messages({
            'any.required': 'ID пользователя не указан!',
            'number.empty': 'Поле ID пользователя пустое!',
            'number.base': 'ID пользователя должен быть в числовом формате!',
            'number.integer': 'ID пользователя должен быть целочисленным!',
        }),
        token: Joi.string()
            .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
            .required()
            .messages({
                'any.required': 'Токен не указан!',
                'string.empty': 'Поле токена пустое!',
                'string.base': 'Токен должен быть в формате строки!',
                'string.pattern': 'Некорректный токен!',
            }),
    });
    validate(request.params, next, schema);
};

const registrationSchema = (request, response, next) => {
    const schema = Joi.object({
        email: Joi.string()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .required()
            .messages({
                'any.required': 'Почта не указана!',
                'string.empty': 'Поле почты пустое!',
                'string.base': 'Почта должна быть указана в виде строки!',
                'string.email':
                    'Указанной почты не существует или она запрещена нашими правилами!',
            }),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-ZА-Яа-яё0-9]{6,256}$'))
            .required()
            .messages({
                'any.required': 'Пароль не указан!',
                'string.empty': 'Поле пароля пустое!',
                'string.base': 'Пароль должен быть указан в виде строки!',
                'string.pattern':
                    'Пароль может содержать в себе английские и русские буквы, цифры и быть длинной от 6 до 256 символов!',
            }),
        surname: Joi.string().min(3).max(100).required().messages({
            'any.required': 'Фамилия не указана!',
            'string.empty': 'Поле фамилии пустое!',
            'string.base': 'Фамилия должна быть указана в виде строки!',
        }),
        firstname: Joi.string().min(3).max(100).required().messages({
            'any.required': 'Имя не указано!',
            'string.empty': 'Поле имени пустое!',
            'string.base': 'Имя должно быть указано в виде строки!',
        }),
        lastname: Joi.string().min(3).max(100).required().messages({
            'any.required': 'Отчество не указано!',
            'string.empty': 'Поле отчества пустое!',
            'string.base': 'Отчество должно быть указано в виде строки!',
        }),
    });
    validate(request.body, next, schema);
};

const authenticateSchema = (request, response, next) => {
    const schema = Joi.object({
        email: Joi.string()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .required()
            .messages({
                'any.required': 'Почта не указана!',
                'string.empty': 'Поле почты пустое!',
                'string.base': 'Почта должна быть указана в виде строки!',
                'string.email':
                    'Указанной почты не существует или она запрещена нашими правилами!',
            }),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-ZА-Яа-яё0-9]{6,256}$'))
            .required()
            .messages({
                'any.required': 'Пароль не указан!',
                'string.empty': 'Поле пароля пустое!',
                'string.base': 'Пароль должен быть указан в виде строки!',
                'string.pattern':
                    'Пароль может содержать в себе английские и русские буквы, цифры и быть длинной от 6 до 256 символов!',
            }),
    });
    validate(request.body, next, schema);
};

const refreshTokenSchema = (request, response, next) => {
    const schema = Joi.object({
        token: Joi.string()
            .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
            .required()
            .messages({
                'any.required': 'Токен не указан!',
                'string.empty': 'Поле токена пустое!',
                'string.base': 'Токен должен быть в формате строки!',
                'string.pattern': 'Некорректный токен!',
            }),
    });
    validate(request.query, next, schema);
};

const updateSchema = (request, response, next) => {
    const schema = Joi.object({
        newInfo: Joi.string().required(),
    });
    validate(request.body, next, schema);
};

//#endregion

//#region Вспомогательные функции

const getUserWithoutSecrets = (user) => {
    const { id, email, firstname, surname, lastname, confirmed } = user;
    return { id, email, firstname, surname, lastname, confirmed };
};

//#endregion

//#region Методы контроллера

exports.forgotPassword = async (request, response) => {
    const postData = request.body;

    const user = await db.User.findOne({
        where: { email: postData.email },
    });

    if (user === null) {
        response
            .status(404)
            .send(new Response('Пользователя с такой почтой нет.'));
        return;
    }

    const token = security.generateCustomToken(
        { email: user.email, updatedAt: user.updatedAt },
        user.passwordHash,
        `${tokens.passwordReset.expires}ms`
    );
    const url = `http://${server.address}:${server.port}/api/v2/users/password/reset/${user.id}/${token}`;

    mail.send(
        user.email,
        `
        <h4>${user.firstname} ${user.lastname}</h4>
        <p>Мы узнали, что вы потеряли свой пароль и соболезнуем об этом!</p>
        <p>Но без паники! Вы можете сбросить пароль, если пройдёте по ссылке:</p>
        <a href=${url}>${url}</a>
        <p>Если вы не используете эту ссылку в течение ${secondsFormattedHMS(
            tokens.passwordReset.expires / 1000
        )}, то она перестанет работать.</p>
        <i>Возникли проблемы? Обратитесь в службу поддержки внутри приложения.</i>
        `
    );

    response
        .status(200)
        .send(new Response('Ссылка для сброса пароля отправлена на почту.'));
};

exports.resetPassword = async (request, response) => {
    const getData = request.params;

    if (getData.token == null || getData.userId == null) {
        return response.status(404).send();
    }

    const user = await db.User.findByPk(getData.userId);
    if (user == null) {
        return response.status(404).send();
    }

    const payload = await security.decodeToken(
        getData.token,
        user.passwordHash
    );

    if (
        payload == null ||
        new Date(payload.updatedAt).toString() !== user.updatedAt.toString()
    ) {
        return response.status(404).send();
    }

    const salt = await security.generateSalt();
    const password = Math.random().toString(36).slice(-8);
    const hash = await security.hashPassword(password, salt);

    await user.update({ passwordHash: hash, passwordSalt: salt });

    mail.send(
        user.email,
        `<h1>Пароль сброшен!</h1><p>Новый пароль: ${password}</p><i>Рекомендуем поменять его на более сложный для безопасности аккаунта.</i>`
    );

    return response.status(200).send('Новый пароль отправлен на почту.');
};

exports.registration = async (request, response) => {
    const postData = request.body;

    const user = await db.User.findOne({
        where: { email: postData.email },
    });

    if (user) {
        return response
            .status(400)
            .send(new Response('Пользователь с такой почтой уже существует.'));
    }

    const salt = await security.generateSalt();
    const hash = await security.hashPassword(postData.password, salt);

    await db.User.create({
        email: postData.email,
        passwordSalt: salt,
        passwordHash: hash,
        surname: postData.surname,
        firstname: postData.firstname,
        lastname: postData.lastname,
    });

    const token = security.generateCustomToken(
        { email: user.email, updatedAt: user.updatedAt },
        user.passwordHash,
        `${tokens.emailConfirmed.expires}ms`
    );
    const url = `http://${server.address}:${server.port}/api/v2/users/registration/confirmed/${user.id}/${token}`;

    mail.send(
        user.email,
        `
        <h4>${user.firstname} ${user.lastname}</h4>
        <p>Эта почта была использована для регистрации в нашей системе!</p>
        <p>Чтобы активировать аккаунт перейдите по ссылке:</p>
        <a href=${url}>${url}</a>
        <p>Если вы не используете эту ссылку в течение ${secondsFormattedHMS(
            tokens.passwordReset.expires / 1000
        )}, то она перестанет работать, а аккаунт будет удален.</p>
        <i>Возникли проблемы? Обратитесь в службу поддержки внутри приложения.</i>
        `
    );

    response
        .status(200)
        .send(
            new Response(
                'Регистрация завершена! Ссылка для активации аккаунта отправлена на почту.'
            )
        );
};

exports.authenticate = async (request, response) => {
    const postData = request.body;

    const user = await db.User.findOne({ where: { email: postData.email } });

    if (user == null) {
        return response
            .status(404)
            .send(new Response('Пользователь с такой почтой не найден.'));
    }

    if (user.confirmed === false) {
        return response
            .status(400)
            .send(
                new Response(
                    'Используйте ссылку для активации аккаунта, которая была отправлена ваш аккаунт при регистрации.'
                )
            );
    }

    const isPasswordRight =
        (await security.hashPassword(postData.password, user.passwordSalt)) ===
        user.passwordHash;
    if (isPasswordRight === false) {
        return response.status(400).send(new Response('Неправильный пароль.'));
    }

    const tokens = security.createTokens(user.id);

    return response.status(200).send(
        new Response(
            'Выполнен вход в систему.',
            'В data данные о пользователе и токены доступа и обновления токена доступа.',
            {
                user: getUserWithoutSecrets(user),
                tokens,
            }
        )
    );
};

exports.refreshToken = (request, response) => {
    const postData = request.body;

    const user = { id: 1 };

    try {
        response
            .status(200)
            .send(
                new Response(
                    'Токен доступа обновлен.',
                    'Новый токен доступа в data.',
                    security.updateAccessToken(user.id, postData.refreshToken)
                )
            );
    } catch (err) {
        response.status(400).send(new Response(err.message));
    }
};

exports.revokeToken = (request, response) => {
    response.send('Ok.');
};

exports.delete = (request, response) => {
    const id = request.user.id;

    db.User.destroy({
        where: { id },
    })
        .then(() => {
            response.status(400).send(new Response('Аккаунт удален.'));
            return;
        })
        .catch((err) => {
            response
                .status(500)
                .send(new Response('Не удалось удалить аккаунт.', null, err));
        });

    // TODO: logout
};

exports.info = (request, response) => {
    response.send('Ok.');
};

exports.update = (request, response) => {
    response.status(500).send(new Response('Не реализовано.'));
};

exports.logout = (request, response) => {
    response.status(500).send(new Response('Не реализовано.'));
};

//#endregion

//#region Маршруты

router.post('/password/forgot', forgotPasswordSchema, this.forgotPassword);
router.get(
    '/password/reset/:userId/:token',
    resetPasswordSchema,
    this.resetPassword
);
router.post('/registration', registrationSchema, this.registration);
/*router.post(
    '/registration/confirmed',
    registrationConfirmedSchema,
    this.registrationConfirmed
);*/
router.post('/authenticate', authenticateSchema, this.authenticate);
router.get(
    '/refresh-token',
    authorize(),
    refreshTokenSchema,
    this.refreshToken
);
router.get('/info', authorize(), this.info);
router.put('/update', authorize(), updateSchema, this.update);
router.delete('/delete', authorize(), this.delete);
router.delete('/logout', authorize(), this.logout);

module.exports = router;

//#endregion
