const Response = require('../response');

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define(
        'refreshtoken',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            token: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            createdByIp: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            expires: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            revoked: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            },
            revokedByIp: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            },
            replacedByTokenId: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            paranoid: true,
            timestamps: true,
        }
    );

    //#region Методы объекта

    Model.prototype.isExpired = function () {
        return Date.now() >= this.expires;
    };

    Model.prototype.isActive = function () {
        return this.revoked === null && this.isExpired === false;
    };

    Model.prototype.revoke = async function (
        ipAddress,
        newRefreshTokenId = null
    ) {
        if (this.revoked !== null) {
            throw new Response('Токен был отозван.');
        }

        this.revoked = Date.now();
        this.revokedByIp = ipAddress;
        this.replacedByTokenId = newRefreshTokenId;

        return await this.save();
    };

    //#endregion

    //#region Методы класса

    Model.findByToken = async (token) => {
        const result = await Model.findOne({
            where: { token },
        });

        if (result === null || result.isActive === false) {
            throw new Response('Некорректный токен.');
        }

        return result;
    };

    Model.findOneByUserId = async (id) => {
        return await Model.findOne({
            where: { userId: id },
            order: [['createdAt', 'DESC']],
        });
    };

    Model.revokeAllActive = async (userId, ipAddress) => {
        const refreshTokens = await Model.findAll({
            where: { userId, revoked: null },
        });
        for await (const refreshToken of refreshTokens) {
            await refreshToken.revoke(ipAddress);
        }
    };

    //#endregion

    return Model;
};
