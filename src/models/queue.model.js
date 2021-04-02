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
            schedules: {
                type: Sequelize.VIRTUAL,
            },
            holidays: {
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
        if (id !== this.ownerId) {
            throw new Response('Управлять очередью может только её владелец.');
        }

        return true;
    };

    //#endregion

    //#region Методы класса

    Model.findByOwnerId = async (id) => {
        return await Model.findAll({
            where: { ownerId: id },
        });
    };

    Model.findByQueueId = async (id) => {
        const result = await Model.findByPk(id);

        if (result === null) {
            throw new Response('Такой очереди не существует.');
        }

        return result;
    };

    //#endregion

    return Model;
};
