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

    return Model;
};
