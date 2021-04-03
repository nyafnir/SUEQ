const { sendEventByQueueId, events } = require('../services/web-socket');

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define(
        'position',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            queueId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            position: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        },
        {
            paranoid: false,
            timestamps: true,
        }
    );

    //#region Методы класса

    Model.findAllByUserId = async (id) => {
        return await Model.findAll({
            where: { userId: id },
        });
    };

    Model.findAllByQueueId = async (id) => {
        return await Model.findAll({
            where: { queueId: id },
        });
    };

    //#endregion

    //#region Вебхуки

    Model.addHook('afterCreate', (position, options) => {
        sendEventByQueueId(
            position.queueId,
            events.QUEUE_MEMBER_ENTRY,
            position
        );
    });

    Model.addHook('afterUpdate', (position, options) => {
        sendEventByQueueId(
            position.queueId,
            events.QUEUE_MEMBER_MOVE,
            position
        );
    });

    Model.addHook('beforeDestroy', (position, options) => {
        sendEventByQueueId(
            position.queueId,
            events.QUEUE_MEMBER_LEAVE,
            position
        );
    });

    //#endregion

    return Model;
};
