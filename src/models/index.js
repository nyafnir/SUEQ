const { database } = require('../config.js');
const Sequelize = require('sequelize');
const { io } = require('../services/web-socket');
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
        logging: database.sequelize.logging,
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//#region Обрабатываемые модели

db.User = require('./user.model')(sequelize, Sequelize);
db.RefreshToken = require('./refreshtoken.model')(sequelize, Sequelize);
db.Queue = require('./queue.model')(sequelize, Sequelize);
db.Position = require('./position.model')(sequelize, Sequelize);
db.Schedule = require('./schedule.model')(sequelize, Sequelize);
db.Holiday = require('./holiday.model')(sequelize, Sequelize);

//#endregion

//#region Связи моделей

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

// Каждая очередь имеет выходные дни
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

//#region Вебхуки между моделями

db.User.addHook('afterUpdate', async (user, options) => {
    const positions = await db.Positions.findAllByUserId(user.id);
    for (const position of positions) {
        io.of('/')
            .in(`queues/${position.queueId}`)
            .emit('USER_UPDATE', user.getWithoutSecrets());
    }
});

db.User.addHook('beforeDestroy', async (user, options) => {
    const queues = await db.Queues.findAllByUserId(user.id);
    for (const queue of queues) {
        const room = `queues/${queue.id}`;
        io.of('/').in(room).emit('USER_DELETED', user.getWithoutSecrets());
        io.sockets.clients(room).forEach((client) => client.leave(room));
    }
});

const closeQueueOnTime = async (queueId) => {
    const queue = await db.Queue.findByQueueId(queueId);
    if (queue.isOpen() === false) {
        const room = `queues/${queueId}`;
        io.of('/').in(room).emit('QUEUE_CLOSED', { queueId });
        io.sockets.clients(room).forEach((client) => client.leave(room));
    }
};

db.Schedule.addHook('afterCreate', async (schedule, options) => {
    const room = `queues/${schedule.queueId}`;
    io.of('/').in(room).emit('QUEUE_SCHEDULE_CREATE', schedule);
});

db.Schedule.addHook('afterUpdate', async (schedule, options) => {
    const room = `queues/${schedule.queueId}`;
    io.of('/').in(room).emit('QUEUE_SCHEDULE_UPDATE', schedule);
    await closeQueueOnTime(schedule.queueId);
});

db.Schedule.addHook('beforeDestroy', async (schedule, options) => {
    const room = `queues/${schedule.queueId}`;
    io.of('/').in(room).emit('QUEUE_SCHEDULE_DELETED', schedule);
    await closeQueueOnTime(schedule.queueId);
});

//#endregion

module.exports = db;
