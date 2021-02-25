const Response = require('../response');
const config = require('../config');

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

    //#region Триггеры

    const account_not_rescue = `
        ON SCHEDULE
            EVERY ${config.database.events.accountNotRescueCheck / 1000} SECOND
        DO 
            DELETE FROM ueq.users WHERE deletedAt < DATE_SUB(NOW(), INTERVAL ${
                config.tokens.accountRescueTimeout / 1000
            } SECOND)
    `;

    const email_not_confirm = `
        ON SCHEDULE
            EVERY ${config.database.events.emailNotConfirmCheck / 1000} SECOND
        DO 
            DELETE FROM ueq.users WHERE confirmed = false AND createdAt < DATE_SUB(NOW(), INTERVAL ${
                config.tokens.emailConfirmedTimeout / 1000
            } SECOND)
        `;

    sequelize.query(
        `
        CREATE EVENT IF NOT EXISTS account_not_rescue ${account_not_rescue};
        
        `
    );

    sequelize.query(
        `
        CREATE EVENT IF NOT EXISTS email_not_confirm ${email_not_confirm};
        `
    );

    sequelize.query(
        `
        ALTER EVENT account_not_rescue ${account_not_rescue};
        `
    );

    sequelize.query(
        `
        ALTER EVENT email_not_confirm ${email_not_confirm};
        `
    );

    //#endregion

    return Model;
};
