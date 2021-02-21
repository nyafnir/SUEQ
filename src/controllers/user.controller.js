const db = require('../models');
const User = db.user;
const Joi = require('joi');
const mail = require('../services/mail');
const security = require('../services/security');
const Response = require('../response');

const schemaForgotPassword = Joi.string()
    .email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
    })
    .required();

exports.forgotPassword = async (request, response) => {
    const { error, value } = schemaForgotPassword.validate(request.query.email);

    if (error) {
        response
            .status(400)
            .send(new Response('Ошибка в запросе.', null, error.message));
        return;
    }

    const user = await User.findOne({ where: { email: value } });
    if (user === null) {
        response
            .status(404)
            .send(new Response('Пользователя с такой почтой нет.'));
        return;
    }

    // TODO: Проверка что пользователь не спамит запрос на сброс пароля

    // TODO: Ссылка на сброс пароля
    mail.send(
        value,
        '<h1>Эта почта была указана для регистрации в нашей системе.</h1><p>Чтобы завершить регистрацию перейдите по ссылке!</p>'
    );

    response
        .status(200)
        .send(new Response('Ссылка для сброса пароля отправлена на почту.'));
};

const schemaRegistration = Joi.object({
    email: Joi.string()
        .email({
            minDomainSegments: 2,
            tlds: { allow: ['com', 'net'] },
        })
        .required(),
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-ZА-Яа-яё0-9]{6,256}$'))
        .required(),
    surname: Joi.string().min(3).max(100).required(),
    firstname: Joi.string().min(3).max(100).required(),
    lastname: Joi.string().min(3).max(100).required(),
});

exports.registration = async (request, response) => {
    const { error, value } = schemaRegistration.validate({
        email: request.body.email,
        password: request.body.password,
        surname: request.body.surname,
        firstname: request.body.firstname,
        lastname: request.body.lastname,
    });
    if (error) {
        response.status(400).send(new Response(error.message));
        return;
    }

    const user = await User.findOne({ where: { email: value.email } });
    if (user !== null) {
        response
            .status(400)
            .send(new Response('Пользователь с такой почтой уже существует.'));
        return;
    }

    const salt = security.generateSalt(12);
    await User.create({
        email: request.body.email,
        passwordHash: security.hash(request.body.password, salt),
        passwordSalt: salt,
        surname: request.body.surname,
        firstname: request.body.firstname,
        lastname: request.body.lastname,
    })
        .then((data) => {
            response
                .status(200)
                .send(
                    new Response('Пользователь зарегистрирован.', null, data)
                );
        })
        .catch((err) => {
            response
                .status(500)
                .send(
                    new Response(
                        'Неизвестная ошибка сервера, сообщите об этом в службу поддержки.',
                        err.message
                    )
                );
        });
};

const schemaLogin = Joi.object({
    email: Joi.string()
        .email({
            minDomainSegments: 2,
            tlds: { allow: ['com', 'net'] },
        })
        .required(),
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-ZА-Яа-яё0-9]{6,256}$'))
        .required(),
});

exports.login = async (request, response) => {
    const postData = request.body;

    const { error, value } = schemaLogin.validate({
        email: postData.email,
        password: postData.password,
    });
    if (error) {
        response.status(400).send(new Response(error.message));
        return;
    }

    const user = await User.findOne({ where: { email: value.email } });

    if (
        user.passwordHash !== security.hash(value.password, user.passwordSalt)
    ) {
        response.status(400).send(new Response('Неправильный пароль.'));
        return;
    }

    const tokens = security.createTokens(user.id);

    response
        .status(200)
        .send(
            new Response(
                'Выполнен вход в систему.',
                'В data два токена: доступа и обновления токена доступа.',
                tokens
            )
        );
};

const schemaRefresh = Joi.string().required();

exports.refresh = (request, response) => {
    const postData = request.body;

    const { error, value } = schemaRefresh.validate({
        refreshToken: postData.refreshToken,
    });
    if (error) {
        response.status(400).send(new Response(error.message));
        return;
    }

    const user = { id: 1 };

    try {
        response
            .status(200)
            .send(
                new Response(
                    'Токен доступа обновлен.',
                    'Новый токен доступа в data.',
                    security.updateAccessToken(user.id, value.refreshToken)
                )
            );
    } catch (err) {
        response.status(400).send(new Response(err.message));
    }
};

exports.delete = (request, response) => {
    // TODO: Определяем по авторизации кто это
    const id = request.params.id;

    User.destroy({
        where: { id: id },
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
};

exports.info = (request, response) => {
    response.status(500).send(new Response('Не реализовано.'));
};

exports.update = (request, response) => {
    response.status(500).send(new Response('Не реализовано.'));
};

exports.logout = (request, response) => {
    response.status(500).send(new Response('Не реализовано.'));
};
