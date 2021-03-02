const Joi = require('joi');
const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const Response = require('../response');
const config = require('../config');
const qrcode = require('qrcode');

//#region Вспомогательные функции

const generateQrCodeQueue = async (queueId) => {
    return await qrcode.toDataURL(
        `http://${config.server.address}:${config.server.port}/api/v2/queues?id=${queueId}`
    );
};

//#endregion

//#region Схемы валидации

const createBodySchema = (request, response, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required().messages({
            'any.required': 'Фамилия не указана!',
            'string.min': 'Минимум {#limit} символа!',
            'string.max': 'Максимум {#limit} символов!',
            'string.empty': 'Поле фамилии пустое!',
            'string.base': 'Фамилия должна быть указана в виде строки!',
        }),
        description: Joi.string().min(3).max(2000).required().messages({
            'any.required': 'Имя не указано!',
            'string.min': 'Минимум {#limit} символа!',
            'string.max': 'Максимум {#limit} символов!',
            'string.empty': 'Поле имени пустое!',
            'string.base': 'Имя должно быть указано в виде строки!',
        }),
    });
    validate(request.body, next, schema);
};

const queueIdQuerySchema = (request, response, next) => {
    const schema = Joi.object({
        queueId: Joi.number().integer().required().messages({
            'any.required': 'ID очереди не указан!',
            'number.empty': 'Поле ID очереди пустое!',
            'number.base': 'ID очереди должен быть в числовом формате!',
            'number.integer': 'ID очереди должен быть целочисленным!',
        }),
    });
    validate(request.query, next, schema);
};

const updateBodySchema = (request, response, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).messages({
            'any.required': 'Фамилия не указана!',
            'string.min': 'Минимум {#limit} символа!',
            'string.max': 'Максимум {#limit} символов!',
            'string.empty': 'Поле фамилии пустое!',
            'string.base': 'Фамилия должна быть указана в виде строки!',
        }),
        description: Joi.string().min(3).max(2000).messages({
            'any.required': 'Имя не указано!',
            'string.min': 'Минимум {#limit} символа!',
            'string.max': 'Максимум {#limit} символов!',
            'string.empty': 'Поле имени пустое!',
            'string.base': 'Имя должно быть указано в виде строки!',
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

const moveBodySchema = (request, response, next) => {
    const schema = Joi.object({
        memberId: Joi.number().integer().required().messages({
            'any.required': 'ID пользователя не указан!',
            'number.empty': 'Поле ID пользователя пустое!',
            'number.base': 'ID пользователя должен быть в числовом формате!',
            'number.integer': 'ID пользователя должен быть целочисленным!',
        }),
        position: Joi.number().integer().required().messages({
            'any.required': 'Новая позиция не указана!',
            'number.empty': 'Поле новая позиция пустое!',
            'number.base': 'Новая позиция должна быть в числовом формате!',
            'number.integer': 'Новая позиция должна быть целочисленной!',
        }),
    });
    validate(request.body, next, schema);
};

//#endregion

//#region Методы контроллера

//#region Очередь

const create = async (request, response, next) => {
    const user = request.user;

    const queues = await db.Queue.findAll({
        where: { ownerId: user.id },
    });

    if (queues.length >= config.queues.owner.limit) {
        return response
            .status(400)
            .send(
                new Response(
                    `Запрещено иметь больше ${config.queues.owner.limit} очередей.`
                )
            );
    }

    const postData = request.body;

    const queue = await db.Queue.create({
        name: postData.name,
        description: postData.description,
        ownerId: user.id,
    });

    queue.qrcode = await generateQrCodeQueue(queue.id);

    return response
        .status(200)
        .send(
            new Response(
                'Очередь создана!',
                'Информация об очереди в data.',
                queue
            )
        );
};

const update = async (request, response, next) => {
    const user = request.user;
    const queueId = request.query.queueId;

    let queue = await db.Queue.findByPk(queueId);

    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    } else if (user.id !== queue.ownerId) {
        return response
            .status(400)
            .send(new Response('Вы не являетесь владельцем этой очереди.'));
    }

    const updateFields = request.body;
    queue = await queue.update(updateFields);

    queue.qrcode = await generateQrCodeQueue(queue.id);

    return response
        .status(200)
        .send(
            new Response(
                'Очередь обновлена!',
                'Обновленная информация об очереди в data.',
                queue
            )
        );
};

const info = async (request, response, next) => {
    const queueId = request.query.queueId;

    const queue = await db.Queue.findByPk(queueId);

    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    }

    queue.qrcode = await generateQrCodeQueue(queue.id);

    return response
        .status(200)
        .send(
            new Response(
                'Очередь обновлена!',
                'Обновленная информация об очереди в data.',
                queue
            )
        );
};

const remove = async (request, response, next) => {
    const user = request.user;
    const queueId = request.query.queueId;

    let queue = await db.Queue.findByPk(queueId);

    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    } else if (user.id !== queue.ownerId) {
        return response
            .status(400)
            .send(new Response('Вы не являетесь владельцем этой очереди.'));
    }

    await queue.destroy();

    return response.status(200).send(new Response('Очередь удалена.'));
};

//#endregion

//#region Позиции

const entry = async (request, response, next) => {
    const user = request.user;
    const queueId = request.query.queueId;

    let queue = await db.Queue.findByPk(queueId);

    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    } else if (queue.isOpen() === false) {
        return response
            .status(400)
            .send(
                new Response(
                    'Эта очередь сейчас закрыта, проверьте часы и дни работы.'
                )
            );
    }

    const members = await db.Position.findAll({ where: { queueId } });

    if (members.some((member) => member.userId === user.id)) {
        return response.status(400).send(new Response('Вы уже в очереди.'));
    }

    const position = await db.Position.create({
        queueId: queue.id,
        userId: user.id,
        position: members.length + 1,
    });

    return response
        .status(200)
        .send(
            new Response(
                'Вы встали в очередь!',
                'В data указана информация о позиции в очереди.',
                position
            )
        );
};

const leave = async (request, response, next) => {
    const user = request.user;
    const queueId = request.query.queueId;

    const position = await db.Position.findOne({
        where: { queueId, userId: user.id },
    });

    if (position === null) {
        return response
            .status(404)
            .send(new Response('Вас нет в этой очереди.'));
    }

    await position.destroy();

    return response.status(200).send(new Response('Вы вышли из очереди!'));
};

const members = async (request, response, next) => {
    const queueId = request.query.queueId;

    const members = await db.Position.findAll({ where: { queueId } });

    if (members.length === 0) {
        return response
            .status(404)
            .send(new Response('Очередь пуста или её не существует.'));
    }

    return response
        .status(200)
        .send(
            new Response(
                'Получена информация об участниках очереди и их позициях.',
                'В data указана информация о позициях в очереди.',
                members
            )
        );
};

const membersMove = async (request, response, next) => {
    const queueId = request.query.queueId;
    const user = request.user;
    const queue = await db.Queue.findByPk(queueId);
    const putData = request.body;

    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    } else if (user.id !== queue.ownerId) {
        return response
            .status(400)
            .send(new Response('Вы не являетесь владельцем этой очереди.'));
    }

    const members = await db.Position.findAll({ where: { queueId } });

    if (members.length === 0) {
        return response
            .status(404)
            .send(new Response('Очередь пуста или её не существует.'));
    } else if (putData.position > members.length) {
        return response
            .status(400)
            .send(new Response('Выход за пределы очереди.'));
    }

    members.sort((a, b) => a.position - b.position);

    const currentPositionIndex = members.findIndex(
        (member) => member.userId === putData.memberId
    );

    if (currentPositionIndex === -1) {
        return response
            .status(400)
            .send(new Response('Пользователя с таким ID в очереди нет.'));
    } else if (currentPositionIndex + 1 === putData.position) {
        return response
            .status(400)
            .send(
                new Response('Пользователь с таким ID уже стоит на этом месте.')
            );
    }

    const newPositionIndex = putData.position - 1;
    if (newPositionIndex > currentPositionIndex) {
        for (let i = currentPositionIndex + 1; i <= newPositionIndex; i += 1) {
            members[i].position += 1;
        }
    } else {
        for (let i = currentPositionIndex - 1; i >= newPositionIndex; i -= 1) {
            members[i].position -= 1;
        }
    }

    members[currentPositionIndex].position = putData.position;

    for await (const member of members) {
        await member.save();
    }

    return response
        .status(200)
        .send(
            new Response(
                'Участник перемещен.',
                'В data указана обновленная информация о позициях в очереди.',
                members
            )
        );
};

//#endregion

//#endregion

//#region Маршруты

router.post('/create', authorize(), createBodySchema, create);
router.put(
    '/update',
    authorize(),
    queueIdQuerySchema,
    updateBodySchema,
    update
);
router.get('/info', authorize(), queueIdQuerySchema, info);
router.delete('/delete', authorize(), queueIdQuerySchema, remove);

router.post('/entry', authorize(), queueIdQuerySchema, entry);
router.delete('/leave', authorize(), queueIdQuerySchema, leave);
router.get('/members', authorize(), queueIdQuerySchema, members);
router.put(
    '/members/move',
    authorize(),
    queueIdQuerySchema,
    moveBodySchema,
    membersMove
);

// TODO: изменение расписания работы

module.exports = router;

//#endregion
