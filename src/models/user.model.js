module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define('user', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        firstname: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        surname: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        lastname: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        passwordHash: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        passwordSalt: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        confirmed: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    });

    return Model;
};
