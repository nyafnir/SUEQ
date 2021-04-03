const jwt = require('jsonwebtoken');
const config = require('../config');

const events = {
    // Positions
    QUEUE_MEMBER_ENTRY: 'QUEUE_MEMBER_ENTRY',
    QUEUE_MEMBER_MOVE: 'QUEUE_MEMBER_MOVE',
    QUEUE_MEMBER_LEAVE: 'QUEUE_MEMBER_LEAVE',
    // Queues
    QUEUE_UPDATE: 'QUEUE_UPDATE',
    QUEUE_DELETED: 'QUEUE_DELETED',
    QUEUE_CLOSED: 'QUEUE_CLOSED',
    // Users
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETED: 'USER_DELETED',
    USER_ONLINE: 'USER_ONLINE',
    USER_OFFLINE: 'USER_OFFLINE',
    // Schedules
    QUEUE_SCHEDULE_CREATE: 'QUEUE_SCHEDULE_CREATE',
    QUEUE_SCHEDULE_UPDATE: 'QUEUE_SCHEDULE_UPDATE',
    QUEUE_SCHEDULE_DELETED: 'QUEUE_SCHEDULE_DELETED',
    // Holidays
    QUEUE_HOLIDAY_CREATE: 'QUEUE_HOLIDAY_CREATE',
    QUEUE_HOLIDAY_UPDATE: 'QUEUE_HOLIDAY_UPDATE',
    QUEUE_HOLIDAY_DELETED: 'QUEUE_HOLIDAY_DELETED',
};

let io;

const getPathRoomByQueueId = (queueId) => {
    return `queues/${queueId}`;
};

const sendEventByQueueId = (queueId, event, data) => {
    io.of('/').in(getPathRoomByQueueId(queueId)).emit(event, data);
};

const kickAllByQueueId = (queueId) => {
    const room = getPathRoomByQueueId(queueId);
    io.sockets.clients(room).forEach((client) => client.leave(room));
};

const initialize = async (httpServer) => {
    io = require('socket.io')(httpServer);

    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(
                socket.handshake.query.token,
                config.tokens.access.secret,
                (err, decoded) => {
                    if (err) {
                        return next(new Error('Неправильный токен.'));
                    }
                    socket.payload = decoded;
                    next();
                }
            );
        } else {
            next(new Error('Не указан токен доступа.'));
        }
    });
};

module.exports = {
    sendEventByQueueId,
    kickAllByQueueId,
    events,
    initialize,
};
