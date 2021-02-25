const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = require('express').Router();
const db = require('../models');
const mail = require('../services/mail');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const Response = require('../response');
const config = require('../config');

//#region Вспомогательные функции

// Приведение секунд к виду: H ч? M мин? S сек
const secondsFormattedHMS = (seconds) => {
    if (seconds > 3600) {
        const hours = Math.trunc(seconds / 3600);
        const minutes = Math.trunc((seconds - hours * 3600) / 60);
        if (minutes) {
            return `${hours} ч ${minutes} мин`;
        }
        return `${hours} ч`;
    }
    if (seconds > 60) {
        return `${Math.trunc(seconds / 60)} мин`;
    }
    return `${seconds} сек`;
};

const getRemoteClientIpAddress = (request) => {
    return (
        request.headers['x-forwarded-for'] || request.connection.remoteAddress
    );
};

const generateToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, {
        expiresIn,
        algorithm: 'HS256',
    });
};

const generateAccessToken = (userId) => {
    return generateToken(
        { id: userId },
        config.tokens.access.secret,
        `${config.tokens.access.life}ms`
    );
};

const generateRefreshToken = (userId, ipAddress) => {
    return new db.RefreshToken({
        userId,
        token: generateToken(
            { id: userId },
            config.tokens.refresh.secret,
            `${config.tokens.refresh.life}ms`
        ),
        expires: new Date(Date.now() + config.tokens.refresh.life),
        createdByIp: ipAddress,
    });
};

const getPayloadFromToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch {
        throw new Response('Токен не действителен.');
    }
};

const generateSalt = async () => {
    return await bcrypt.genSalt(config.hash.saltRounds);
};

const generateHash = async (data, saltOrRounds) => {
    return await bcrypt.hash(data, saltOrRounds);
};

const recordRefreshTokenInCookie = (response, token) => {
    response.cookie('refreshToken', token, {
        httpOnly: true,
        secure: false,
        expires: new Date(Date.now() + config.tokens.refresh.life),
    });
};

const removeRefreshTokenFromCookie = (response) => {
    response.clearCookie('refreshToken');
};

//#endregion

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

const userIdAndTokenSchema = (request, response, next) => {
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
                'string.pattern.base': 'Некорректный токен!',
            }),
    });
    validate(request.params, next, schema);
};

const tokenSchema = (request, response, next) => {
    const schema = Joi.object({
        token: Joi.string()
            .empty('')
            .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
            .messages({
                'string.base': 'Токен должен быть в формате строки!',
                'string.pattern.base': 'Некорректный токен!',
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
                'string.pattern.base':
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
                'string.pattern.base':
                    'Пароль может содержать в себе английские и русские буквы, цифры и быть длинной от 6 до 256 символов!',
            }),
    });
    validate(request.body, next, schema);
};

const updateSchema = (request, response, next) => {
    const schema = Joi.object({
        email: Joi.string()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .messages({
                'any.required': 'Почта не указана!',
                'string.empty': 'Поле почты пустое!',
                'string.base': 'Почта должна быть указана в виде строки!',
                'string.email':
                    'Указанной почты не существует или она запрещена нашими правилами!',
            }),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-ZА-Яа-яё0-9]{6,256}$'))
            .messages({
                'any.required': 'Пароль не указан!',
                'string.empty': 'Поле пароля пустое!',
                'string.base': 'Пароль должен быть указан в виде строки!',
                'string.pattern.base':
                    'Пароль может содержать в себе английские и русские буквы, цифры и быть длинной от 6 до 256 символов!',
            }),
        surname: Joi.string().min(3).max(100).messages({
            'any.required': 'Фамилия не указана!',
            'string.empty': 'Поле фамилии пустое!',
            'string.base': 'Фамилия должна быть указана в виде строки!',
        }),
        firstname: Joi.string().min(3).max(100).messages({
            'any.required': 'Имя не указано!',
            'string.empty': 'Поле имени пустое!',
            'string.base': 'Имя должно быть указано в виде строки!',
        }),
        lastname: Joi.string().min(3).max(100).messages({
            'any.required': 'Отчество не указано!',
            'string.empty': 'Поле отчества пустое!',
            'string.base': 'Отчество должно быть указано в виде строки!',
        }),
    })
        .min(1) // Не даёт отправить {}
        .required() // Не даёт отправить undefined
        .messages({
            'object.min':
                'Для обновления должно быть указано хотя бы одно поле!',
        });
    validate(request.body, next, schema);
};

//#endregion

//#region Методы контроллера

exports.forgotPassword = async (request, response, next) => {
    const postData = request.body;

    let user;
    try {
        user = await db.User.findByEmail(postData.email);
    } catch (error) {
        return next(error);
    }

    if (user.confirmed === false) {
        return response
            .status(400)
            .send(
                new Response(
                    'Вы не подтвердили свой почтовый адрес, сбросить пароль невозможно.'
                )
            );
    }

    const token = generateToken(
        { email: user.email, updatedAt: user.updatedAt, userId: user.id },
        user.passwordHash,
        `${config.tokens.passwordResetTimeout}ms`
    );
    const url = `http://${config.server.address}:${config.server.port}/api/v2/users/password/reset/${user.id}/${token}`;

    mail.send(
        user.email,
        `<h4>${user.firstname} ${user.lastname}</h4>
        <p>Мы узнали, что вы потеряли свой пароль и соболезнуем об этом!</p>
        <p>Но без паники! Вы можете сбросить пароль, если используете ссылку:</p>
        <a href=${url}>${url}</a>
        <p>Если вы не используете эту ссылку в течение ${secondsFormattedHMS(
            config.tokens.passwordResetTimeout / 1000
        )}, то она перестанет работать.</p>
        <i>Возникли проблемы? Обратитесь в службу поддержки внутри приложения.</i>`
    );

    return response
        .status(200)
        .send(new Response('Ссылка для сброса пароля отправлена на почту.'));
};

exports.resetPassword = async (request, response) => {
    const getData = request.params;

    const user = await db.User.findByPk(getData.userId);

    if (user === null) {
        return response.status(404).send();
    }

    const payload = await getPayloadFromToken(getData.token, user.passwordHash);

    if (
        payload.userId !== user.id ||
        // Если профиль пользователя был изменен, то значит пароль уже сброшен или пользователь восстановил доступ
        new Date(payload.updatedAt).toString() !== user.updatedAt.toString()
    ) {
        return response.status(404).send();
    }

    const salt = await generateSalt();
    const password = Math.random().toString(36).slice(-8);
    const hash = await generateHash(password, salt);

    await user.update({ passwordHash: hash, passwordSalt: salt });

    mail.send(
        user.email,
        `<h1>Пароль сброшен!</h1><p>Новый пароль: ${password}</p>
        <i>Рекомендуем поменять его на более сложный для безопасности аккаунта.</i>`
    );

    return response.status(200).send('Новый пароль отправлен на почту.');
};

exports.registration = async (request, response) => {
    const postData = request.body;

    let user = await db.User.findByEmail(postData.email).catch(() => null);

    if (user) {
        return response
            .status(400)
            .send(new Response('Пользователь с такой почтой уже существует.'));
    }

    const salt = await generateSalt();
    const hash = await generateHash(postData.password, salt);

    user = await db.User.create({
        email: postData.email,
        passwordSalt: salt,
        passwordHash: hash,
        surname: postData.surname,
        firstname: postData.firstname,
        lastname: postData.lastname,
    });

    const token = generateToken(
        { userId: user.id },
        user.passwordSalt,
        `${config.tokens.emailConfirmedTimeout}ms`
    );
    const url = `http://${config.server.address}:${config.server.port}/api/v2/users/registration/confirm/${user.id}/${token}`;

    mail.send(
        user.email,
        `<h4>${user.firstname} ${user.lastname}</h4>
        <p>Эта почта была использована для регистрации в нашей системе!</p>
        <p>Чтобы активировать аккаунт используйте ссылку:</p>
        <a href=${url}>${url}</a>
        <p>Если вы не используете эту ссылку в течение ${secondsFormattedHMS(
            config.tokens.emailConfirmedTimeout / 1000
        )}, то она перестанет работать, а аккаунт будет удален.</p>
        <i>Возникли проблемы? Обратитесь в службу поддержки внутри приложения.</i>`
    );

    return response
        .status(200)
        .send(
            new Response(
                'Регистрация завершена! Ссылка для активации аккаунта отправлена на почту.'
            )
        );
};

exports.registrationConfirm = async (request, response) => {
    const getData = request.params;

    const user = await db.User.findByPk(getData.userId);

    if (user === null || user.confirmed) {
        return response.status(404).send();
    }

    const payload = getPayloadFromToken(getData.token, user.passwordSalt);

    if (payload.userId !== user.id) {
        return response.status(404).send();
    }

    await user.update({ confirmed: true });

    mail.send(user.email, `<h1>Аккаунт активирован!</h1>`);

    return response
        .status(200)
        .send('Почта подтверждена, теперь вы можете войти в аккаунт.');
};

exports.authenticate = async (request, response, next) => {
    const postData = request.body;

    let user;
    try {
        user = await db.User.findByEmail(postData.email);
    } catch (error) {
        return next(error);
    }

    if (user.confirmed === false) {
        return response
            .status(400)
            .send(
                new Response(
                    'Используйте ссылку для активации аккаунта, которая была отправлена вашу почту при регистрации.'
                )
            );
    }

    const isWrongPassword =
        (await generateHash(postData.password, user.passwordSalt)) !==
        user.passwordHash;

    if (isWrongPassword) {
        return response.status(400).send(new Response('Неправильный пароль.'));
    }

    const accessToken = generateAccessToken(user.id);
    const ipAddress = getRemoteClientIpAddress(request);
    const refreshToken = generateRefreshToken(user.id, ipAddress);

    await refreshToken.save();

    recordRefreshTokenInCookie(response, refreshToken.token);

    return response.status(200).send(
        new Response(
            'Выполнен вход в систему.',
            'В data публичный объект user и объект с токенами.',
            {
                user: user.getWithoutSecrets(),
                tokens: {
                    access: {
                        token: accessToken,
                        expires: new Date(
                            Date.now() + config.tokens.access.life
                        ),
                    },
                    refresh: {
                        token: refreshToken.token,
                        expires: refreshToken.expires,
                    },
                },
            }
        )
    );
};

exports.refreshToken = async (request, response, next) => {
    const token = request.body.token || request.cookies.refreshToken;

    if (token == null) {
        return response
            .status(400)
            .send(new Response('У вас нет токена обновления.'));
    }

    let oldRefreshToken;
    try {
        oldRefreshToken = await db.RefreshToken.findByToken(token);
    } catch (error) {
        return next(error);
    }
    const user =
        request.user || (await db.User.findByPk(oldRefreshToken.userId));

    const ipAddress = getRemoteClientIpAddress(request);
    const newRefreshToken = generateRefreshToken(user.id, ipAddress);
    await newRefreshToken.save();

    oldRefreshToken.revoke(ipAddress, newRefreshToken.id);
    await oldRefreshToken.save();

    const accessToken = generateAccessToken(user.id);

    recordRefreshTokenInCookie(response, newRefreshToken.token);

    return response.status(200).send(
        new Response(
            'Вход в систему обновлен.',
            'В data объект user и объект с новыми токенами.',
            {
                user: user.getWithoutSecrets(),
                tokens: {
                    access: {
                        token: accessToken,
                        expires: new Date(
                            Date.now() + config.tokens.access.life
                        ),
                    },
                    refresh: {
                        token: newRefreshToken.token,
                        expires: newRefreshToken.expires,
                    },
                },
            }
        )
    );
};

exports.revokeToken = async (request, response, next) => {
    const token = request.body.token || request.cookies.refreshToken;

    if (token == null) {
        return response
            .status(400)
            .send(new Response('У вас нет токена обновления.'));
    }

    let refreshToken;
    try {
        refreshToken = await db.RefreshToken.findByToken(token);
    } catch (error) {
        return next(error);
    }

    if (request.user.id !== refreshToken.userId) {
        return response.status(400).send(new Response('Это не ваш токен.'));
    }

    const ipAddress = getRemoteClientIpAddress(request);

    try {
        await refreshToken.revoke(ipAddress);
    } catch (error) {
        return next(error);
    }

    removeRefreshTokenFromCookie(response);

    return response.status(200).send(new Response('Токен отозван.'));
};

exports.info = async (request, response) => {
    const user = await db.User.findByPk(request.user.id);
    return response
        .status(200)
        .send(
            new Response(
                'Данные о пользователе получены.',
                'Публичные данные о пользователе указаны в data.',
                user.getWithoutSecrets()
            )
        );
};

exports.update = async (request, response) => {
    const user = request.user;
    const updateFields = request.body;

    if (updateFields.password !== null) {
        const salt = await generateSalt();
        const hash = await generateHash(updateFields.password, salt);
        updateFields.passwordHash = hash;
        updateFields.passwordSalt = salt;
        delete updateFields.password;
    }

    await user.update(updateFields);

    return response
        .status(200)
        .send(
            new Response(
                'Данные о пользователе обновлены.',
                'Публичные данные о пользователе указаны в data.',
                user.getWithoutSecrets()
            )
        );
};

exports.logoutEverywhere = async (request, response, next) => {
    const ipAddress = getRemoteClientIpAddress(request);

    for await (const refreshToken of request.user.refreshTokens) {
        await refreshToken.revoke(ipAddress).catch(() => null);
    }

    removeRefreshTokenFromCookie(response);

    response
        .status(200)
        .send(
            new Response(
                'Вы вышли из системы.',
                'Все токены обновления отозваны, но токены доступа всё ещё работают, просто удалите их из вашего приложения.'
            )
        );
};

exports.delete = async (request, response, next) => {
    let user = request.user;

    let refreshToken;
    try {
        refreshToken = await db.RefreshToken.findOneByUserId(user.id);
    } catch (error) {
        return next(error);
    }
    const ipAddress = getRemoteClientIpAddress(request);
    try {
        await refreshToken.revoke(ipAddress);
    } catch (error) {
        return next(error);
    }

    removeRefreshTokenFromCookie(response);

    const token = generateToken(
        { userId: user.id },
        user.passwordHash,
        `${config.tokens.accountRescueTimeout}ms`
    );
    const url = `http://${config.server.address}:${config.server.port}/api/v2/users/delete/cancel/${user.id}/${token}`;
    mail.send(
        user.email,
        `<h4>${user.firstname} ${user.lastname}</h4>
        <p>Ваш аккаунт был поставлен в очередь на удаление!</p>
        <p>Чтобы восстановить аккаунт используйте ссылку:</p>
        <a href=${url}>${url}</a>
        <p>Если вы не используете эту ссылку в течение ${secondsFormattedHMS(
            config.tokens.accountRescueTimeout / 1000
        )}, то она перестанет работать, а аккаунт будет безвозвратно удален.</p>
        <i>Возникли проблемы? Обратитесь в службу поддержки внутри приложения.</i>`
    );

    return response
        .status(200)
        .send(
            new Response(
                `Аккаунт частично удален, полное удаление через ${secondsFormattedHMS(
                    config.tokens.accountRescueTimeout / 1000
                )}.`
            )
        );
};

exports.deleteCancel = async (request, response) => {
    const getData = request.params;

    const user = await db.User.findByPk(getData.userId);

    if (user === null || user.deletedAt !== null) {
        return response.status(404).send();
    }

    const payload = getPayloadFromToken(getData.token, user.passwordHash);

    if (payload.userId !== user.id) {
        return response.status(404).send();
    }

    await user.update({ deletedAt: null });

    mail.send(user.email, `<h1>Аккаунт восстановлен!</h1>`);

    return response
        .status(200)
        .send('Удаление аккаунта отменено, теперь вы можете вернуться.');
};

//#endregion

//#region Маршруты

router.post('/password/forgot', forgotPasswordSchema, this.forgotPassword);
router.get(
    '/password/reset/:userId/:token',
    userIdAndTokenSchema,
    this.resetPassword
);

router.post('/registration', registrationSchema, this.registration);
router.get(
    '/registration/confirm/:userId/:token',
    userIdAndTokenSchema,
    this.registrationConfirm
);

router.post('/authenticate', authenticateSchema, this.authenticate);
router.delete('/logout/everywhere', authorize(), this.logoutEverywhere);

router.put('/refresh-token', tokenSchema, this.refreshToken);
router.delete('/revoke-token', authorize(), tokenSchema, this.revokeToken);

router.get('/info', authorize(), this.info);
router.put('/update', authorize(), updateSchema, this.update);

router.delete('/delete', authorize(), this.delete);
router.get(
    '/delete/cancel/:userId/:token',
    userIdAndTokenSchema,
    this.deleteCancel
);

module.exports = router;

//#endregion
