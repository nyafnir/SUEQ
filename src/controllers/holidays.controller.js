const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../utils/response');
const config = require('../config');
const {
    holidayIdSchema,
    createHolidaySchema,
    updateHolidaySchema,
} = require('../utils/schems.joi');

//#region Методы контроллера

const create = async (request, response, next) => {
    const postDate = request.body;

    const queue = await db.Queue.findByQueueId(postDate.queueId);
    queue.checkOwnerId(request.user.id);

    if (queue.holidays.length > config.queues.limits.holidays) {
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
    let holiday = await db.Holiday.findByHolidayId(request.query.holidayId);

    const queue = await db.Queue.findByQueueId(holiday.queueId);
    queue.checkOwnerId(request.user.id);

    holiday = await holiday.update(request.body);

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
    let holiday = await db.Holiday.findByHolidayId(request.query.holidayId);

    const queue = await db.Queue.findByQueueId(holiday.queueId);
    queue.checkOwnerId(request.user.id);

    await holiday.destroy();

    return response.status(200).send(new Response('Особый день удален.'));
};

//#endregion

//#region Маршруты

router.post(
    '/create',
    authorize(),
    (request, response, next) =>
        createHolidaySchema(request.body, response, next),
    async (request, response, next) => {
        await create(request, response, next).catch(next);
    }
);
router.put(
    '/update',
    authorize(),
    (request, response, next) => holidayIdSchema(request.query, response, next),
    (request, response, next) =>
        updateHolidaySchema(request.body, response, next),
    async (request, response, next) => {
        await update(request, response, next).catch(next);
    }
);
router.delete(
    '/delete',
    authorize(),
    (request, response, next) => holidayIdSchema(request.query, response, next),
    async (request, response, next) => {
        await remove(request, response, next).catch(next);
    }
);

module.exports = router;

//#endregion
