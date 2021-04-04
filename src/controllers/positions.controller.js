const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../response');
const config = require('../config');
const { queueIdSchema, movePositionSchema } = require('../utils/schems.joi');
const { sendEventByQueueId, events } = require('../services/web-socket');

//#region Методы контроллера

const entry = async (request, response, next) => {
    const user = request.user;

    const queue = await db.Queue.findByQueueId(request.query.queueId);

    if (queue.isOpen() === false) {
        return response
            .status(400)
            .send(
                new Response(
                    'Эта очередь сейчас закрыта, проверьте часы и дни работы.'
                )
            );
    }

    if (user.positions.length > config.queues.limits.member) {
        return response
            .status(400)
            .send(
                new Response(
                    `Вы не можете стоять в более чем ${config.queues.limits.member} очередей одновременно.`
                )
            );
    }

    if (user.positions.some((position) => position.queueId === queue.id)) {
        return response
            .status(400)
            .send(new Response('Вы уже стоите в этой очереди.'));
    }

    const position = await db.Position.create({
        queueId: queue.id,
        userId: user.id,
        place: queue.positions.length + 1,
    });

    return response
        .status(200)
        .send(
            new Response(
                'Вы встали в очередь!',
                'В data указана информация о позициях в очереди.',
                [...queue.positions, position]
            )
        );
};

const list = async (request, response, next) => {
    const queueId = request.query.queueId;

    const members = await db.Position.findAllByQueueId(queueId);

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

const move = async (request, response, next) => {
    const queue = await db.Queue.findByQueueId(request.query.queueId);

    queue.checkOwnerId(request.user.id);

    const putData = request.body;

    let members = queue.positions;

    if (members.length === 0) {
        return response
            .status(404)
            .send(new Response('Очередь пуста или её не существует.'));
    } else if (putData.place > members.length) {
        return response
            .status(400)
            .send(new Response('Выход за предел очереди.'));
    }

    const oldPositionIndex = members.findIndex(
        (position) => position.userId === putData.userId
    );

    if (oldPositionIndex === -1) {
        return response
            .status(404)
            .send(new Response('Такого пользователя в очереди нет.'));
    } else if (members[oldPositionIndex].place === putData.place) {
        return response
            .status(400)
            .send(new Response('Пользователь уже стоит на этом месте.'));
    }

    const moveMember = members.splice(oldPositionIndex, 1).shift();
    members.sort((a, b) => a.place - b.place);
    const head = members.splice(0, putData.place);
    members = [...head, moveMember, ...members];
    for (let i = 0; i < members.length; i += 1) {
        members[i].place = i + 1;
        await members[i].save();
    }

    sendEventByQueueId(queue.id, events.QUEUE_MEMBER_MOVE, {
        position: moveMember,
        members,
    });

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

const leave = async (request, response, next) => {
    const position = request.user.positions.find(
        (position) => request.query.queueId == position.queueId
    );

    if (position === undefined) {
        return response
            .status(404)
            .send(new Response('Вас нет в этой очереди.'));
    }

    await position.destroy();

    return response.status(200).send(new Response('Вы покинули очередь.'));
};

//#endregion

//#region Маршруты

router.post(
    '/entry',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    async (request, response, next) => {
        await entry(request, response, next).catch(next);
    }
);

router.delete(
    '/leave',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    async (request, response, next) => {
        await leave(request, response, next).catch(next);
    }
);

router.get(
    '/list',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    async (request, response, next) => {
        await list(request, response, next).catch(next);
    }
);

router.put(
    '/move',
    authorize(),
    (request, response, next) => queueIdSchema(request.query, response, next),
    (request, response, next) =>
        movePositionSchema(request.body, response, next),
    async (request, response, next) => {
        await move(request, response, next).catch(next);
    }
);

module.exports = router;

//#endregion
