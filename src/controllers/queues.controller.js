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

    if (user.queues.length > config.queues.limits.owner) {
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
    let queue = await db.Queue.findByQueueId(request.query.queueId);

    queue.checkOwnerId(request.user.id);

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
    const queue = await db.Queue.findByQueueId(request.query.queueId);

    queue.qrcode = await generateQrCodeQueue(queue.id);

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
    const queue = await db.Queue.findByQueueId(request.query.queueId);

    queue.checkOwnerId(request.user.id);

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
    async (request, response, next) => {
        await create(request, response, next).catch(next);
    }
);
router.put(
    '/update',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    (request, response, next) =>
        updateQueueSchema(request.body, response, next),
    async (request, response, next) => {
        await update(request, response, next).catch(next);
    }
);
router.get(
    '/info',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    async (request, response, next) => {
        await info(request, response, next).catch(next);
    }
);
router.delete(
    '/delete',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    async (request, response, next) => {
        await remove(request, response, next).catch(next);
    }
);

module.exports = router;

//#endregion
