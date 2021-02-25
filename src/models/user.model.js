module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define(
        'user',
        {
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
        },
        {
            paranoid: true,
            timestamps: true,
        }
    );

    //#region Методы объекта

    Model.prototype.getWithoutSecrets = function () {
        const { id, email, firstname, surname, lastname } = this;
        return { id, email, firstname, surname, lastname };
    };

    //#endregion

    //#region Методы класса

    Model.findByEmail = async (email) => {
        const result = await Model.findOne({
            where: { email },
        });

        if (result === null) {
            throw new Response('Пользователь с такой почтой не найден.');
        }

        return result;
    };

    //#endregion

    return Model;
};
