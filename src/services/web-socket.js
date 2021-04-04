const jwt = require('jsonwebtoken');
const config = require('../config');
const events = require('../utils/events.sio');

let io;

const getPathRoomByQueueId = (queueId) => {
    return `queues/${queueId}`;
};

const sendEventByQueueId = (queueId, event, data) => {
    io.of('/').in(getPathRoomByQueueId(queueId)).emit(event, data);
};

const kickAllByQueueId = (queueId) => {
    const room = getPathRoomByQueueId(queueId);
    const usersInRoom = io.of('/').in(room).clients;
    if (usersInRoom !== undefined) {
        usersInRoom.forEach((client) => client.leave(room));
    }
};

class Message {
    constructor(code = 200, event = events.MESSAGE, data = null) {
        this.code = code;
        this.operation = event;
        this.data = data;
    }
    Message() {
        return {
            code: this.code,
            operation: this.operation,
            data: this.data,
        };
    }
}

const initialize = async (httpServer) => {
    io = require('socket.io')(httpServer);

    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(
                socket.handshake.query.token,
                config.tokens.access.secret,
                (err, decoded) => {
                    if (err) {
                        return next(new Error(`Ошибка токена: ${err}`));
                    }
                    socket.payload = decoded;
                    next();
                }
            );
        } else {
            return next(new Error('Не указан токен доступа.'));
        }
    }).on('connection', (client) => {
        client.on(events.QUEUE_SUBSCRIBE, (data) => {
            try {
                client.join(getPathRoomByQueueId(data.queueId));
            } catch {
                return client.emit(
                    events.MESSAGE,
                    new Message(
                        404,
                        events.QUEUE_SUBSCRIBE,
                        `Комнаты с QID: ${data.queueId} не существует.`
                    )
                );
            }
            client.emit(
                events.MESSAGE,
                new Message(
                    200,
                    events.QUEUE_SUBSCRIBE,
                    `UID: ${client.payload.id} присоединен к комнате с QID: ${data.queueId}.`
                )
            );
        });
    });
};

module.exports = {
    sendEventByQueueId,
    kickAllByQueueId,
    events,
    initialize,
};
