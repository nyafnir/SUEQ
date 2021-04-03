const Response = require('../response');
const config = require('../config');
const { io } = require('../services/web-socket');

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
            throw new Response('Пользователя с такой почтой не существует.');
        }

        return result;
    };

    Model.findByUserId = async (id) => {
        const result = await Model.findOne({
            where: { id },
        });

        if (result === null) {
            throw new Response('Такого пользователя не существует.');
        }

        return result;
    };

    //#endregion

    //#region Вебхуки

    Model.addHook('afterUpdate', (user, options) => {
        // Сообщаем во все очереди где есть этот пользователь обновленную информацию
        // io.of('/').in(`queues/${queue.id}`).emit('USER_UPDATE', user);
    });

    Model.addHook('beforeDestroy', (user, options) => {
        // выкидываем всех из комнат этого владельца и сообщаем им об этом
        // const room = `queues/${queue.id}`;
        // io.of('/').in(room).emit('USER_REMOVE', user);
        // io.sockets.clients(room).forEach((client) => client.leave(room));
    });

    //#endregion

    //#region Триггеры

    const account_not_rescue = `
        ON SCHEDULE
            EVERY ${config.database.events.accountNotRescueCheck / 1000} SECOND
        DO 
            DELETE FROM ueq.users WHERE deletedAt < DATE_SUB(NOW(), INTERVAL ${
                config.tokens.accountRescue.life / 1000
            } SECOND)
    `;

    const email_not_confirm = `
        ON SCHEDULE
            EVERY ${config.database.events.emailNotConfirmCheck / 1000} SECOND
        DO 
            DELETE FROM ueq.users WHERE confirmed = false AND createdAt < DATE_SUB(NOW(), INTERVAL ${
                config.tokens.emailConfirm.life / 1000
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
