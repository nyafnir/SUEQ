const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const Response = require('../response');
const config = require('../config');
const { queueIdSchema, movePositionSchema } = require('../utils/schems.joi');

//#region Методы контроллера

const entry = async (request, response, next) => {
    const user = request.user;

    const queue = await db.Queue.findByQueueId(request.params.queueId);

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
        position: queue.positions.length + 1,
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

const leave = async (request, response, next) => {
    const position = request.user.positions.find(
        (position) => request.params.queueId === position.queueId
    );

    if (position === null) {
        return response
            .status(404)
            .send(new Response('Вас нет в этой очереди.'));
    }

    await position.destroy();

    return response.status(200).send(new Response('Вы покинули очередь.'));
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
    const queue = await db.Queue.findByQueueId(request.params.queueId);

    queue.checkOwnerId(request.user.id);

    const putData = request.body;

    const members = queue.positions;

    if (members.length === 0) {
        return response
            .status(404)
            .send(new Response('Очередь пуста или её не существует.'));
    } else if (putData.position > members.length) {
        return response
            .status(400)
            .send(new Response('Выход за предел очереди.'));
    }

    members.sort((a, b) => a.position - b.position);

    const currentPositionIndex = members.findIndex(
        (member) => member.userId === putData.memberId
    );

    if (currentPositionIndex === -1) {
        return response
            .status(404)
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

//#region Маршруты

router.post(
    '/entry',
    authorize(),
    (request, response, next) => queueIdSchema(request.params, response, next),
    entry
);

router.delete(
    '/leave',
    authorize(),
    (request, response, next) => queueIdSchema(request.params, response, next),
    leave
);

router.get(
    '/list',
    authorize(),
    (request, response, next) => queueIdSchema(request.params, response, next),
    list
);

router.put(
    '/move',
    authorize(),
    (request, response, next) => queueIdSchema(request.params, response, next),
    (request, response, next) =>
        movePositionSchema(request.body, response, next),
    move
);

module.exports = router;

//#endregion
