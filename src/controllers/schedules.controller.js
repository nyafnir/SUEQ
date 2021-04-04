const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../response');
const config = require('../config');
const {
    scheduleIdSchema,
    createScheduleSchema,
    updateScheduleSchema,
} = require('../utils/schems.joi');

//#region Методы контроллера

const create = async (request, response, next) => {
    const postDate = request.body;

    const queue = await db.Queue.findByQueueId(postDate.queueId);
    queue.checkOwnerId(request.user.id);

    if (queue.schedules.length > config.queues.limits.schedules) {
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
    let schedule = await db.Schedule.findByScheduleId(request.query.scheduleId);

    const queue = await db.Queue.findByQueueId(schedule.queueId);
    queue.checkOwnerId(request.user.id);

    schedule = await schedule.update(request.body);

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
    let schedule = await db.Schedule.findByScheduleId(request.query.scheduleId);

    const queue = await db.Queue.findByQueueId(schedule.queueId);
    queue.checkOwnerId(request.user.id);

    await schedule.destroy();

    return response.status(200).send(new Response('Расписание удалено.'));
};

//#endregion

//#region Маршруты

router.post(
    '/create',
    authorize(),
    (request, response, next) =>
        createScheduleSchema(request.body, response, next),
    async (request, response, next) => {
        await create(request, response, next).catch(next);
    }
);

router.put(
    '/update',
    authorize(),
    (request, response, next) =>
        scheduleIdSchema(request.query, response, next),
    (request, response, next) =>
        updateScheduleSchema(request.body, response, next),
    async (request, response, next) => {
        await update(request, response, next).catch(next);
    }
);

router.delete(
    '/delete',
    authorize(),
    (request, response, next) =>
        scheduleIdSchema(request.query, response, next),
    async (request, response, next) => {
        await remove(request, response, next).catch(next);
    }
);

module.exports = router;

//#endregion
