const Response = require('../response');
const {
    sendEventByQueueId,
    kickAllByQueueId,
    events,
} = require('../services/web-socket');

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define(
        'queue',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            ownerId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            qrcode: {
                type: Sequelize.VIRTUAL,
            },
        },
        {
            paranoid: false,
            timestamps: true,
        }
    );

    //#region Методы объекта

    Model.prototype.checkOwnerId = function (id) {
        if (id != this.ownerId) {
            throw new Response('Управлять очередью может только её владелец.');
        }

        return true;
    };

    //#endregion

    //#region Методы класса

    Model.findByOwnerId = async (id) => {
        return await Model.findAll({
            where: { ownerId: id },
            include: [{ all: true, nested: true }],
        });
    };

    Model.findByQueueId = async (id) => {
        const result = await Model.findOne({
            where: { id },
            include: [{ all: true, nested: true }],
        });

        if (result === null) {
            throw new Response('Такой очереди не существует.');
        }

        return result;
    };

    //#endregion

    //#region Вебхуки

    Model.addHook('afterUpdate', (queue, options) => {
        sendEventByQueueId(queue.id, events.QUEUE_UPDATE, queue);
    });

    Model.addHook('beforeDestroy', (queue, options) => {
        sendEventByQueueId(queue.id, events.QUEUE_DELETED, queue);
        kickAllByQueueId(queue.id);
    });

    //#endregion

    return Model;
};
