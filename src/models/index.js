const { database } = require('../config.js');

const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    database.credentials.database,
    database.credentials.user,
    database.credentials.password,
    {
        host: database.credentials.host,
        port: database.credentials.port,
        dialect: database.dialect,
        pool: {
            max: database.pool.max,
            min: database.pool.min,
            acquire: database.pool.acquire,
            idle: database.pool.idle,
        },
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//#region Обрабатываемые модели

db.user = require('./user.model.js')(sequelize, Sequelize);

//#endregion

module.exports = db;
