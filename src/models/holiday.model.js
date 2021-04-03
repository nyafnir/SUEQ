module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define(
        'holiday',
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
            // Конкретный день, конкретного года
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            // 1 - праздник, 0 - рабочий день
            isHoliday: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
        },
        {
            paranoid: false,
            timestamps: true,
        }
    );

    //#region Методы класса

    Model.findByHolidayId = async (id) => {
        const result = await Model.findByPk(id);

        if (result === null) {
            throw new Response('Такого особого дня не существует.');
        }

        return result;
    };

    Model.findAllByQueueId = async (id) => {
        return await Model.findAll({
            where: { queueId: id },
        });
    };

    //#endregion

    return Model;
};
