const Joi = require('joi');
const router = require('express').Router();
const db = require('../models');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const Response = require('../response');
const config = require('../config');

//#region Схемы валидации

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

const moveBodySchema = (request, response, next) => {
    const schema = Joi.object({
        memberId: Joi.number().integer().required().messages({
            'any.required': 'ID пользователя не указан!',
            'number.empty': 'Поле ID пользователя пустое!',
            'number.base': 'ID пользователя должен быть в числовом формате!',
            'number.integer': 'ID пользователя должен быть целочисленным!',
        }),
        position: Joi.number().integer().required().messages({
            'any.required': 'Новая позиция не указана!',
            'number.empty': 'Поле новая позиция пустое!',
            'number.base': 'Новая позиция должна быть в числовом формате!',
            'number.integer': 'Новая позиция должна быть целочисленной!',
        }),
    });
    validate(request.body, next, schema);
};

//#endregion

//#region Методы контроллера

const entry = async (request, response, next) => {
    const user = request.user;
    const queueId = request.query.queueId;
    let queue = await db.Queue.findByPk(queueId);
    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    } else if (queue.isOpen() === false) {
        return response
            .status(400)
            .send(
                new Response(
                    'Эта очередь сейчас закрыта, проверьте часы и дни работы.'
                )
            );
    }

    const positions = await db.Position.findAll({
        where: { userId: user.id },
    });
    if (positions.length > config.queues.member.limit) {
        return response
            .status(400)
            .send(
                new Response(
                    `Вы не можете стоять в более чем ${config.queues.member.limit} очередей одновременно.`
                )
            );
    }

    const members = await db.Position.findAll({ where: { queueId } });
    if (members.some((member) => member.userId === user.id)) {
        return response.status(400).send(new Response('Вы уже в очереди.'));
    }

    const position = await db.Position.create({
        queueId: queue.id,
        userId: user.id,
        position: members.length + 1,
    });

    return response
        .status(200)
        .send(
            new Response(
                'Вы встали в очередь!',
                'В data указана информация о позиции в очереди.',
                position
            )
        );
};

const leave = async (request, response, next) => {
    const user = request.user;
    const queueId = request.query.queueId;

    const position = await db.Position.findOne({
        where: { queueId, userId: user.id },
    });

    if (position === null) {
        return response
            .status(404)
            .send(new Response('Вас нет в этой очереди.'));
    }

    await position.destroy();

    return response.status(200).send(new Response('Вы вышли из очереди!'));
};

const members = async (request, response, next) => {
    const queueId = request.query.queueId;

    const members = await db.Position.findAll({ where: { queueId } });

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
    const queueId = request.query.queueId;
    const user = request.user;
    const queue = await db.Queue.findByPk(queueId);
    const putData = request.body;

    if (queue === null) {
        return response.status(404).send(new Response('Очередь не найдена.'));
    } else if (user.id !== queue.ownerId) {
        return response
            .status(400)
            .send(new Response('Вы не являетесь владельцем этой очереди.'));
    }

    const members = await db.Position.findAll({ where: { queueId } });

    if (members.length === 0) {
        return response
            .status(404)
            .send(new Response('Очередь пуста или её не существует.'));
    } else if (putData.position > members.length) {
        return response
            .status(400)
            .send(new Response('Выход за пределы очереди.'));
    }

    members.sort((a, b) => a.position - b.position);

    const currentPositionIndex = members.findIndex(
        (member) => member.userId === putData.memberId
    );

    if (currentPositionIndex === -1) {
        return response
            .status(400)
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

router.post('/entry', authorize(), queueIdQuerySchema, entry);
router.delete('/leave', authorize(), queueIdQuerySchema, leave);
router.get('/members', authorize(), queueIdQuerySchema, members);
router.put('/move', authorize(), queueIdQuerySchema, moveBodySchema, move);

module.exports = router;

//#endregion
