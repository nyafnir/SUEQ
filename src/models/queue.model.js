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
        },
        {
            paranoid: false,
            timestamps: true,
        }
    );

    return Model;
};
