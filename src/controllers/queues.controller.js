const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../response');
const config = require('../config');
const qrcode = require('qrcode');
const {
    queueIdSchema,
    createQueueSchema,
    updateQueueSchema,
} = require('../utils/schems.joi');
const { io } = require('../services/web-socket');

//#region Вспомогательные функции

const generateQrCodeQueue = async (queueId) => {
    return await qrcode.toDataURL(
        `http://${config.server.address}:${config.server.port}/api/v2/queues?id=${queueId}`
    );
};

//#endregion

//#region Методы контроллера

const create = async (request, response, next) => {
    const user = request.user;

    const queues = await db.Queue.findByOwnerId(user.id);

    if (queues.length > config.queues.limits.owner) {
        return response
            .status(400)
            .send(
                new Response(
                    `Запрещено иметь во владении очередей больше, чем ${config.queues.limits.owner}.`
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
    const queueId = request.query.queueId;
    const user = request.user;

    let queue = await db.Queue.findByQueueId(queueId);

    queue.checkOwnerId(user.id);

    const updateFields = request.body;

    queue = await queue.update(updateFields);

    queue.qrcode = await generateQrCodeQueue(queue.id);

    io.of('/').in(`queues/${queue.id}`).emit('QUEUE_UPDATE', queue);

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

    const queue = await db.Queue.findByQueueId(queueId);

    queue.qrcode = await generateQrCodeQueue(queue.id);

    queue.schedules = await db.Schedule.findByQueueId(queue.id);

    queue.holidays = await db.Holiday.findByQueueId(queue.id);

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
    const queueId = request.query.queueId;
    const user = request.user;

    let queue = await db.Queue.findByQueueId(queueId);

    queue.checkOwnerId(user.id);

    const room = `queues/${queue.id}`;
    io.of('/').in(room).emit('QUEUE_REMOVE', queue);
    io.sockets.clients(room).forEach((client) => client.leave(room));

    await queue.destroy();

    return response.status(200).send(new Response('Очередь удалена.'));
};

//#endregion

//#region Маршруты

router.post(
    '/create',
    authorize(),
    (request, response, next) =>
        createQueueSchema(request.body, response, next),
    create
);
router.put(
    '/update',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    (request, response, next) =>
        updateQueueSchema(request.body, response, next),
    update
);
router.get(
    '/info',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    info
);
router.delete(
    '/delete',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    remove
);

module.exports = router;

//#endregion
