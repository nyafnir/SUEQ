const Joi = require('joi');
const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const Response = require('../response');
const config = require('../config');

//#region Схемы валидации

const scheduleIdQuerySchema = (request, response, next) => {
    const schema = Joi.object({
        scheduleId: Joi.number().integer().required().messages({
            'any.required': 'ID раписания не указан!',
            'number.empty': 'Поле ID раписания пустое!',
            'number.base': 'ID раписания должен быть в числовом формате!',
            'number.integer': 'ID раписания должен быть целочисленным!',
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
        startTime: Joi.string()
            .regex(config.regexs.timeonly)
            .required()
            .messages({
                'any.required': 'Время открытия не указано!',
                'string.empty': 'Поле времени открытия пустое!',
                'string.base':
                    'Время открытия должно быть указано в виде времени в формате ЧЧ:ММ!',
                'string.pattern':
                    'Неправильно указано время открытия, используйте формат ЧЧ:ММ!',
            }),
        endTime: Joi.string()
            .regex(config.regexs.timeonly)
            .required()
            .messages({
                'any.required': 'Время закрытия не указано!',
                'string.empty': 'Поле времени закрытия пустое!',
                'string.base':
                    'Время закрытия должно быть указано в виде времени в формате ЧЧ:ММ!',
                'string.pattern':
                    'Неправильно указано время закрытия, используйте формат ЧЧ:ММ!',
            }),
        weekday: Joi.number().integer().messages({
            'number.empty': 'Поле с битовой маской рабочих дней пустое!',
            'number.base':
                'Битовая маска рабочих дней должна быть десятичным числом!',
            'number.integer':
                'Битовая маска рабочих дней должна быть целочисленной!',
        }),
        workFrom: Joi.string().regex(config.regexs.dateonly).messages({
            'string.empty': 'Поле начало периода пустое!',
            'string.base': 'Начало периода должно быть указано в виде строки!',
            'string.pattern':
                'Ошибка форматирования, дата начала периода должна быть представлена в виде ГГГГ-ММ-ДД.',
        }),
        workTo: Joi.string().regex(config.regexs.dateonly).messages({
            'string.empty': 'Поле конца периода пустое!',
            'string.base': 'Конец периода должен быть указан в виде строки!',
            'string.pattern':
                'Ошибка форматирования, дата конца периода должна быть представлена в виде ГГГГ-ММ-ДД.',
        }),
    });
    validate(request.body, next, schema);
};

const updateBodySchema = (request, response, next) => {
    const schema = Joi.object({
        startTime: Joi.string().regex(config.regexs.timeonly).messages({
            'string.empty': 'Поле времени открытия пустое!',
            'string.base':
                'Время открытия должно быть указано в виде времени в формате ЧЧ:ММ!',
            'string.pattern':
                'Неправильно указано время открытия, используйте формат ЧЧ:ММ!',
        }),
        endTime: Joi.string().regex(config.regexs.timeonly).messages({
            'string.empty': 'Поле времени закрытия пустое!',
            'string.base':
                'Время закрытия должно быть указано в виде времени в формате ЧЧ:ММ!',
            'string.pattern':
                'Неправильно указано время закрытия, используйте формат ЧЧ:ММ!',
        }),
        weekday: Joi.number().integer().messages({
            'number.empty': 'Поле с битовой маской рабочих дней пустое!',
            'number.base':
                'Битовая маска рабочих дней должна быть десятичным числом!',
            'number.integer':
                'Битовая маска рабочих дней должна быть целочисленной!',
        }),
        workFrom: Joi.string().regex(config.regexs.dateonly).messages({
            'string.empty': 'Поле начало периода пустое!',
            'string.base': 'Начало периода должно быть указано в виде строки!',
            'string.pattern':
                'Ошибка форматирования, дата начала периода должна быть представлена в виде ГГГГ-ММ-ДД.',
        }),
        workTo: Joi.string().regex(config.regexs.dateonly).messages({
            'string.empty': 'Поле конца периода пустое!',
            'string.base': 'Конец периода должен быть указан в виде строки!',
            'string.pattern':
                'Ошибка форматирования, дата конца периода должна быть представлена в виде ГГГГ-ММ-ДД.',
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

    const schedules = await db.Schedule.findAll({
        where: { queueId: postDate.queueId },
    });
    if (schedules.length > config.queues.limits.schedules) {
        return response
            .status(400)
            .send(
                new Response(
                    `Очередь не может иметь больше ${config.queues.limits.schedules} расписаний.`
                )
            );
    }

    const schedule = await db.Schedule.create(postDate);

    return response
        .status(200)
        .send(
            new Response(
                'Расписание добавлено.',
                'Расписание указано в data',
                schedule
            )
        );
};

const update = async (request, response, next) => {
    const scheduleId = request.query.scheduleId;
    let schedule = await db.Schedule.findByPk(scheduleId);
    if (schedule === null) {
        return response
            .status(404)
            .send(new Response('Расписания с таким ID не найдено.'));
    }

    const user = request.user;
    const queue = await db.Queue.findByPk(schedule.queueId);
    if (queue.ownerId !== user.id) {
        return response
            .status(400)
            .send(
                new Response(
                    'Вы не являетесь владельцем очереди, которой принадлежит это расписание.'
                )
            );
    }

    const putDate = request.body;
    schedule = await schedule.update(putDate);

    return response
        .status(200)
        .send(
            new Response(
                'Расписание обновлено.',
                'Обновленное расписание указано в data',
                schedule
            )
        );
};

const remove = async (request, response, next) => {
    const scheduleId = request.query.scheduleId;
    let schedule = await db.Schedule.findByPk(scheduleId);
    if (schedule === null) {
        return response
            .status(404)
            .send(new Response('Расписания с таким ID не найдено.'));
    }

    const user = request.user;
    const queue = await db.Queue.findByPk(schedule.queueId);
    if (queue.ownerId !== user.id) {
        return response
            .status(400)
            .send(
                new Response(
                    'Вы не являетесь владельцем очереди, которой принадлежит это расписание.'
                )
            );
    }

    await schedule.destroy();

    return response.status(200).send(new Response('Расписание удалено.'));
};

//#endregion

//#region Маршруты

router.post('/create', authorize(), createBodySchema, create);
router.put(
    '/update',
    authorize(),
    scheduleIdQuerySchema,
    updateBodySchema,
    update
);
router.delete('/delete', authorize(), scheduleIdQuerySchema, remove);

module.exports = router;

//#endregion
