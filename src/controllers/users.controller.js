const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../models');
const mail = require('../services/mail');
const letters = require('../utils/letters.mail');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../response');
const config = require('../config');
const {
    registrationUserSchema,
    authenticateUserSchema,
    updateUserSchema,
    tokenSchema,
    userIdAndTokenSchema,
    forgotPasswordUserSchema,
} = require('../utils/schems.joi');

//#region Вспомогательные функции

const getRemoteClientIpAddress = (request) => {
    return (
        request.headers['x-forwarded-for'] || request.connection.remoteAddress
    );
};

const generateToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, {
        expiresIn: `${expiresIn}ms`,
        algorithm: 'HS256',
    });
};

const generateAccessToken = (userId) => {
    return generateToken(
        { id: userId },
        config.tokens.access.secret,
        config.tokens.access.life
    );
};

const generateRefreshToken = (userId, ipAddress) => {
    return new db.RefreshToken({
        userId,
        token: generateToken(
            { id: userId },
            config.tokens.refresh.secret,
            config.tokens.refresh.life
        ),
        expires: new Date(Date.now() + config.tokens.refresh.life),
        createdByIp: ipAddress,
    });
};

const getPayloadFromToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Response('Токен не действителен.', error);
    }
};

const generateSalt = async () => {
    return await bcrypt.genSalt(config.hash.saltRounds);
};

const generateHash = async (data, saltOrRounds) => {
    return await bcrypt.hash(data, saltOrRounds);
};

//#endregion

//#region Методы контроллера

const forgotPassword = async (request, response, next) => {
    const postData = request.body;

    const user = await db.User.findByEmail(postData.email);

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
        { userId: user.id, email: user.email, updatedAt: user.updatedAt },
        config.tokens.passwordReset.secret,
        config.tokens.passwordReset.life
    );
    const url = `http://${config.server.address}:${config.server.port}/api/v2/users/password/reset?userid=${user.id}&token=${token}`;

    mail.send(user.email, letters.forgotPassword(url));

    return response
        .status(200)
        .send(new Response('Ссылка для сброса пароля отправлена на почту.'));
};

const resetPassword = async (request, response, next) => {
    const getData = request.params;

    const user = await db.User.findByUserId(getData.userId);

    const payload = getPayloadFromToken(
        getData.token,
        config.tokens.resetPassword.secret
    );

    if (payload.userId !== user.id) {
        return response
            .status(400)
            .send(new Response('Это токен другого пользователя.'));
    }

    if (new Date(payload.updatedAt).toString() !== user.updatedAt.toString()) {
        return response
            .status(400)
            .send(
                new Response(
                    'Пароль уже был сброшен или пользователь восстановил доступ.'
                )
            );
    }

    const salt = await generateSalt();
    const password = Math.random().toString(36).slice(-8);
    const hash = await generateHash(password, salt);

    await user.update({ passwordHash: hash, passwordSalt: salt });

    mail.send(user.email, letters.resetPassword(password));

    return response.status(200).send('Новый пароль отправлен на почту.');
};

const registration = async (request, response, next) => {
    const postData = request.body;

    let user = await db.User.findByEmail(postData.email).catch(() => null);

    if (user) {
        return response
            .status(400)
            .send(new Response('Пользователь с такой почтой уже существует.'));
    }

    const salt = await generateSalt();
    user = await db.User.create({
        email: postData.email,
        passwordSalt: salt,
        passwordHash: await generateHash(postData.password, salt),
        surname: postData.surname,
        firstname: postData.firstname,
        lastname: postData.lastname,
    });

    const token = generateToken(
        { userId: user.id },
        config.tokens.registrationConfirm.secret,
        config.tokens.emailConfirm.life
    );

    const url = `http://${config.server.address}:${config.server.port}/api/v2/users/registration/confirm?userid=${user.id}&token=${token}`;

    mail.send(user.email, letters.registrationConfirm(url));

    return response
        .status(200)
        .send(
            new Response(
                'Регистрация завершена! Ссылка для активации аккаунта отправлена на почту, если не активировать аккаунт, то он будет удален.'
            )
        );
};

const registrationConfirm = async (request, response, next) => {
    const getData = request.params;

    const user = await db.User.findByUserId(getData.userId);

    if (user.confirmed) {
        return response
            .status(400)
            .send(new Response('Почта уже была подтверждена.'));
    }

    const payload = getPayloadFromToken(
        getData.token,
        config.tokens.registrationConfirm.secret
    );

    if (payload.userId !== user.id) {
        return response
            .status(400)
            .send(new Response('Это токен другого пользователя.'));
    }

    await user.update({ confirmed: true });

    return response
        .status(200)
        .send(
            new Response(
                'Почта подтверждена, теперь вы можете войти в аккаунт.'
            )
        );
};

const authenticate = async (request, response, next) => {
    const postData = request.body;

    const user = await db.User.findByEmail(postData.email);

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

const info = async (request, response, next) => {
    return response
        .status(200)
        .send(
            new Response(
                'Данные о пользователе получены.',
                'Публичные данные о пользователе указаны в data.',
                request.user.getWithoutSecrets()
            )
        );
};

const update = async (request, response, next) => {
    const updateFields = request.body;

    if (updateFields.password !== null) {
        updateFields.passwordSalt = await generateSalt();
        updateFields.passwordHash = await generateHash(
            updateFields.password,
            updateFields.passwordSalt
        );
        delete updateFields.password;
    }

    const user = request.user;
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

const refreshToken = async (request, response, next) => {
    const token = request.body.token;

    const oldRefreshToken = await db.RefreshToken.findByToken(token);

    const user = await db.User.findByUserId(oldRefreshToken.userId);

    const ipAddress = getRemoteClientIpAddress(request);
    const newRefreshToken = generateRefreshToken(user.id, ipAddress);
    await newRefreshToken.save();

    oldRefreshToken.revoke(ipAddress, newRefreshToken.id);
    await oldRefreshToken.save();

    const accessToken = generateAccessToken(user.id);

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

const revokeRefreshToken = async (request, response, next) => {
    const token = request.body.token;

    const refreshToken = await db.RefreshToken.findByToken(token);

    if (request.user.id !== refreshToken.userId) {
        return response.status(400).send(new Response('Это не ваш токен.'));
    }

    const ipAddress = getRemoteClientIpAddress(request);

    await refreshToken.revoke(ipAddress);

    return response.status(200).send(new Response('Токен отозван.'));
};

const revokeRefreshTokens = async (request, response, next) => {
    const ipAddress = getRemoteClientIpAddress(request);

    const refreshTokens = await db.refreshToken.findAllByUserId(
        request.user.id
    );

    for await (const refreshToken of refreshTokens) {
        await refreshToken.revoke(ipAddress).catch(() => null);
    }

    response
        .status(200)
        .send(
            new Response(
                'Все токены обновления отозваны.',
                'Все токены обновления отозваны, но токены доступа всё ещё работают.'
            )
        );
};

const deleteAccount = async (request, response, next) => {
    const user = request.user;

    // Фиксируем последний IP, который вызывал удаление аккаунта
    const ipAddress = getRemoteClientIpAddress(request);
    await refreshToken.revoke(ipAddress);

    const token = generateToken(
        { userId: user.id },
        config.tokens.accountRescue.secret,
        config.tokens.accountRescue.life
    );

    const url = `http://${config.server.address}:${config.server.port}/api/v2/users/delete/cancel?userid=${user.id}&token=${token}`;
    mail.send(user.email, letters.deleteAccount(url));

    return response
        .status(200)
        .send(
            new Response(
                `Аккаунт поставлен в очередь на удаление, доступ закрыт.`
            )
        );
};

const deleteAccountCancel = async (request, response, next) => {
    const getData = request.params;

    const user = await db.User.findOne({
        where: {
            userId: getData.userId,
        },
        paranoid: false,
    });

    const payload = getPayloadFromToken(
        getData.token,
        config.tokens.accountRescue.secret
    );

    if (payload.userId !== user.id) {
        return response
            .status(400)
            .send(new Response('Это токен другого пользователя.'));
    }

    await user.update({ deletedAt: null });

    return response
        .status(200)
        .send(new Response('Удаление аккаунта отменено.'));
};

//#endregion

//#region Маршруты

router.post(
    '/password/forgot',
    (request, response, next) =>
        forgotPasswordUserSchema(request.body, response, next),
    forgotPassword
);

router.get(
    '/password/reset',
    (request, response, next) =>
        userIdAndTokenSchema(request.params, response, next),
    resetPassword
);

router.post(
    '/registration',
    (request, response, next) =>
        registrationUserSchema(request.body, response, next),
    registration
);

router.get(
    '/registration/confirm',
    (request, response, next) =>
        userIdAndTokenSchema(request.params, response, next),
    registrationConfirm
);

router.post(
    '/authenticate',
    (request, response, next) =>
        authenticateUserSchema(request.body, response, next),
    authenticate
);

router.put(
    '/refresh-token',
    (request, response, next) => tokenSchema(request.params, response, next),
    refreshToken
);

router.delete(
    '/revoke-token',
    authorize(),
    (request, response, next) => tokenSchema(request.params, response, next),
    revokeRefreshToken
);

router.delete('/revoke-tokens', authorize(), revokeRefreshTokens);

router.get('/info', authorize(), info);

router.put(
    '/update',
    authorize(),
    (request, response, next) => updateUserSchema(request.body, response, next),
    update
);

router.delete('/delete', authorize(), deleteAccount);

router.get(
    '/delete/cancel',
    (request, response, next) => tokenSchema(request.params, response, next),
    deleteAccountCancel
);

module.exports = router;

//#endregion
