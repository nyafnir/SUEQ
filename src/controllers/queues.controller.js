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

const scheduleBodySchema = (request, response, next) => {
    const schema = Joi.object();
    validate(request.body, next, schema);
};

//#endregion

//#region Методы контроллера

const create = async (request, response, next) => {
    const user = request.user;

    const queues = await db.Queue.findAll({
        where: { ownerId: user.id },
    });

    if (queues.length > config.queues.owner.limit) {
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
    queue.schedules = await db.Schedule.findAll({
        where: { queueId: queue.id },
    });

    return response
        .status(200)
        .send(
            new Response(
                'Информация об очереди получена.',
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

module.exports = router;

//#endregion
