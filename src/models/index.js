const { database } = require('../config.js');
const Sequelize = require('sequelize');
const { DATE } = require('sequelize');

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

//#region Обрабатываемые модели и их связи

db.User = require('./user.model')(sequelize, Sequelize);
db.RefreshToken = require('./refreshtoken.model')(sequelize, Sequelize);
db.Queue = require('./queue.model')(sequelize, Sequelize);
db.Position = require('./position.model')(sequelize, Sequelize);
db.Schedule = require('./schedule.model')(sequelize, Sequelize);
db.Holiday = require('./holiday.model')(sequelize, Sequelize);

// Каждый пользователь может иметь много токенов
db.User.hasMany(db.RefreshToken, {
    foreignKey: 'userId',
});
db.RefreshToken.belongsTo(db.User, {
    foreignKey: 'userId',
});

// Каждый пользовать может владеть множеством очередей
db.User.hasMany(db.Queue, {
    foreignKey: 'ownerId',
});
db.Queue.belongsTo(db.User, {
    foreignKey: 'ownerId',
});

// Каждый пользовать может стоять во множестве очередей
db.User.hasMany(db.Position, {
    foreignKey: 'userId',
});
db.Position.belongsTo(db.User, {
    foreignKey: 'userId',
});

// Каждая очередь имеет участников
db.Queue.hasMany(db.Position, {
    foreignKey: 'queueId',
});
db.Position.belongsTo(db.Queue, {
    foreignKey: 'queueId',
});

// Каждая очередь имеет расписания работы
db.Queue.hasMany(db.Queue, {
    foreignKey: 'queueId',
});
db.Schedule.belongsTo(db.Queue, {
    foreignKey: 'queueId',
});

// Каждая очередь имеет не рабочие дни
db.Queue.hasMany(db.Queue, {
    foreignKey: 'queueId',
});
db.Holiday.belongsTo(db.Queue, {
    foreignKey: 'queueId',
});

//#endregion

//#region Методы между моделями

db.Queue.prototype.isOpen = async function () {
    const now = new Date();

    const holiday = await db.Holiday.findOne({
        where: { date: { [Sequelize.Op.eq]: now } },
    });

    if (holiday === null || holiday.isHoliday === false) {
        const schedule = await db.Schedule.findOne({
            where: {
                queueId: this.id,
                workFrom: {
                    [Sequelize.Op.lte]: now, // <=
                },
                workTo: {
                    [Sequelize.Op.gte]: now, // >=
                },
                startTime: {
                    [Sequelize.Op.lte]: now, // <=
                },
                endTime: {
                    [Sequelize.Op.gte]: now, // >=
                },
                [Sequelize.Op.and]: [
                    Sequelize.literal(`\`weekday\` & ${1 << now.getDay()}`),
                ],
            },
        });
        if (schedule !== null) {
            return true;
        }
    }

    return false;
};

//#endregion

module.exports = db;
