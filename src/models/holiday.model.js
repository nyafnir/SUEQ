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

    Model.findByQueueId = async (id) => {
        return await Model.findAll({
            where: { queueId: id },
        });
    };

    //#endregion

    return Model;
};
