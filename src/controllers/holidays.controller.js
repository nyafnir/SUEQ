const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../response');
const config = require('../config');
const {
    holidayIdSchema,
    createHolidaySchema,
    updateHolidaySchema,
} = require('../utils/schems.joi');

//#region Методы контроллера

const create = async (request, response, next) => {
    const postDate = request.body;

    const holidays = await db.Holiday.findAllByQueueId(postDate.queueId);

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
    create
);
router.put(
    '/update',
    authorize(),
    (request, response, next) =>
        holidayIdSchema(request.params, response, next),
    (request, response, next) =>
        updateHolidaySchema(request.body, response, next),
    update
);
router.delete(
    '/delete',
    authorize(),
    (request, response, next) =>
        holidayIdSchema(request.params, response, next),
    remove
);

module.exports = router;

//#endregion
