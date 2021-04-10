const { database } = require('../config.js');
const Sequelize = require('sequelize');
const {
    sendEventByQueueId,
    kickAllByQueueId,
    events,
} = require('../services/web-socket');
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
    onDelete: 'CASCADE',
    hooks: true,
});
db.RefreshToken.belongsTo(db.User, {
    foreignKey: 'id',
});

// Каждый пользовать может владеть множеством очередей
db.User.hasMany(db.Queue, {
    foreignKey: 'ownerId',
    onDelete: 'CASCADE',
    hooks: true,
});
db.Queue.belongsTo(db.User, {
    foreignKey: 'id',
});

// Каждый пользовать может стоять во множестве очередей
db.User.hasMany(db.Position, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    hooks: true,
});
db.Position.belongsTo(db.User, {
    foreignKey: 'id',
});

// Каждая очередь имеет участников
db.Queue.hasMany(db.Position, {
    foreignKey: 'queueId',
    onDelete: 'CASCADE',
    hooks: true,
});
db.Position.belongsTo(db.Queue, {
    foreignKey: 'id',
});

// Каждая очередь имеет расписания работы
db.Queue.hasMany(db.Schedule, {
    foreignKey: 'queueId',
    onDelete: 'CASCADE',
    hooks: true,
});
db.Schedule.belongsTo(db.Queue, {
    foreignKey: 'id',
});

// Каждая очередь имеет выходные дни
db.Queue.hasMany(db.Holiday, {
    foreignKey: 'queueId',
    onDelete: 'CASCADE',
    hooks: true,
});
db.Holiday.belongsTo(db.Queue, {
    foreignKey: 'id',
});

//#endregion

//#region Методы между моделями

db.Queue.prototype.isOpen = async function () {
    const nowDate = new Date();
    nowDate.setHours(0, 0, 0, 0);
    const holiday = this.holidays.find(
        (h) => h.date.getTime() === nowDate.getTime()
    );

    if (holiday === undefined || holiday.isHoliday === false) {
        const nowDatetime = new Date();

        const currentTime = `${('0' + nowDatetime.getHours()).slice(-2)}:${(
            '0' + nowDatetime.getMinutes()
        ).slice(-2)}:${('0' + nowDatetime.getSeconds()).slice(-2)}`;

        const schedule = this.schedules.find((s) => {
            s.workFrom.getTime() <= nowDate.getTime() &&
                s.workTo.getTime() >= nowDate.getTime() &&
                s.startTime <= currentTime &&
                s.endTime >= currentTime &&
                (s.weekday & (1 << nowDatetime.getDay())) > 0;
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
    for (const position of user.positions) {
        sendEventByQueueId(
            position.queueId,
            events.USER_UPDATE,
            user.getScopePublic()
        );
    }
});

db.User.addHook('beforeDestroy', async (user, options) => {
    for (const queue of user.queues) {
        sendEventByQueueId(queue.id, events.QUEUE_DELETED, queue);
        kickAllByQueueId(queue.id);
    }
});

const closeQueueOnTime = async (queueId) => {
    const queue = await db.Queue.findByQueueId(queueId);
    if (queue.isOpen() === false) {
        sendEventByQueueId(queue.id, events.QUEUE_CLOSED, queue);
        kickAllByQueueId(queue.id);
    }
};

db.Schedule.addHook('afterCreate', async (schedule, options) => {
    sendEventByQueueId(
        schedule.queueId,
        events.QUEUE_SCHEDULE_CREATE,
        schedule
    );
});

db.Schedule.addHook('afterUpdate', async (schedule, options) => {
    sendEventByQueueId(
        schedule.queueId,
        events.QUEUE_SCHEDULE_UPDATE,
        schedule
    );
});

db.Schedule.addHook('afterDestroy', async (schedule, options) => {
    sendEventByQueueId(
        schedule.queueId,
        events.QUEUE_SCHEDULE_DELETED,
        schedule
    );
    await closeQueueOnTime(schedule.queueId);
});

db.Holiday.addHook('afterCreate', async (holiday, options) => {
    sendEventByQueueId(holiday.queueId, events.QUEUE_HOLIDAY_CREATE, holiday);
    await closeQueueOnTime(holiday.queueId);
});

db.Holiday.addHook('afterUpdate', async (holiday, options) => {
    sendEventByQueueId(holiday.queueId, events.QUEUE_HOLIDAY_UPDATE, holiday);
    await closeQueueOnTime(holiday.queueId);
});

db.Holiday.addHook('afterDestroy', async (holiday, options) => {
    sendEventByQueueId(holiday.queueId, events.QUEUE_HOLIDAY_DELETED, holiday);
    await closeQueueOnTime(holiday.queueId);
});

//#endregion

async function checkTimeClosed() {
    const queues = await db.Queue.findAll({
        include: [{ all: true, nested: true }],
    });

    for (const queue of queues) {
        if (queue.isOpen() === false) {
            sendEventByQueueId(queue.id, events.QUEUE_CLOSED, queue);
        }
    }

    setTimeout(() => checkTimeClosed(), 60 * 1000);
}

checkTimeClosed();

module.exports = db;
