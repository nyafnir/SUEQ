const Joi = require('joi');
const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const Response = require('../response');
const config = require('../config');

//#region Схемы валидации

const holidayIdQuerySchema = (request, response, next) => {
    const schema = Joi.object({
        holidayId: Joi.number().integer().required().messages({
            'any.required': 'ID особого дня не указан!',
            'number.empty': 'Поле ID особого дня пустое!',
            'number.base': 'ID особого дня должен быть в числовом формате!',
            'number.integer': 'ID особого дня должен быть целочисленным!',
        }),
    });
    validate(request.query, next, schema);
};
const createBodySchema = (request, response, next) => {
    const schema = Joi.object({
        queueId: Joi.number().integer().required().messages({
            'any.required': 'ID очереди не указан!',
            'number.empty': 'Поле ID очереди пустое!',
            'number.base': 'ID очереди должен быть в числовом формате!',
            'number.integer': 'ID очереди должен быть целочисленным!',
        }),
        date: Joi.string().regex(config.regexs.dateonly).required().messages({
            'any.required': 'Особый день не указан!',
            'string.empty': 'Поле дня пустое!',
            'string.base': 'День должен быть указан в виде строки!',
            'string.pattern':
                'Ошибка форматирования, день должен быть представлен в виде ГГГГ-ММ-ДД.',
        }),
        isHoliday: Joi.boolean().required().messages({
            'any.required': 'Не указано значение для типа дня!',
            'boolean.base': 'Тип дня должен быть указан булевым значением!',
        }),
    });
    validate(request.body, next, schema);
};

const updateBodySchema = (request, response, next) => {
    const schema = Joi.object({
        date: Joi.string().regex(config.regexs.dateonly).messages({
            'string.empty': 'Поле дня пустое!',
            'string.base': 'День должен быть указан в виде строки!',
            'string.pattern':
                'Ошибка форматирования, день должен быть представлен в виде ГГГГ-ММ-ДД.',
        }),
        isHoliday: Joi.boolean().messages({
            'boolean.base': 'Тип дня должен быть указан булевым значением!',
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

const create = async (request, response, next) => {
    const postDate = request.body;

    const holidays = await db.Holiday.findAll({
        where: { queueId: postDate.queueId },
    });
    if (holidays.length > config.queues.limits.holidays) {
        return response
            .status(400)
            .send(
                new Response(
                    `Очередь не может иметь больше ${config.queues.limits.holidays} особых дней.`
                )
            );
    }

    const holiday = await db.Holiday.create(postDate);

    return response
        .status(200)
        .send(
            new Response('Особый день добавлен.', 'Особый день в data', holiday)
        );
};

const update = async (request, response, next) => {
    const holidayId = request.query.holidayId;
    let holiday = await db.Holiday.findByPk(holidayId);
    if (holiday === null) {
        return response
            .status(404)
            .send(new Response('Особого дня с таким ID не найдено.'));
    }

    const user = request.user;
    const queue = await db.Queue.findByPk(holiday.queueId);
    if (queue.ownerId !== user.id) {
        return response
            .status(400)
            .send(
                new Response(
                    'Вы не являетесь владельцем очереди, которой принадлежит этот особый день.'
                )
            );
    }

    const putDate = request.body;
    holiday = await holiday.update(putDate);

    return response
        .status(200)
        .send(
            new Response(
                'Особый день обновлен.',
                'Обновленный особый день в data',
                holiday
            )
        );
};

const remove = async (request, response, next) => {
    const holidayId = request.query.holidayId;
    let holiday = await db.Holiday.findByPk(holidayId);
    if (holiday === null) {
        return response
            .status(404)
            .send(new Response('Особого дня с таким ID не найдено.'));
    }

    const user = request.user;
    const queue = await db.Queue.findByPk(holiday.queueId);
    if (queue.ownerId !== user.id) {
        return response
            .status(400)
            .send(
                new Response(
                    'Вы не являетесь владельцем очереди, которой принадлежит этот особый день.'
                )
            );
    }

    await holiday.destroy();

    return response.status(200).send(new Response('Особый день удален.'));
};

//#endregion

//#region Маршруты

router.post('/create', authorize(), createBodySchema, create);
router.put(
    '/update',
    authorize(),
    holidayIdQuerySchema,
    updateBodySchema,
    update
);
router.delete('/delete', authorize(), holidayIdQuerySchema, remove);

module.exports = router;

//#endregion
