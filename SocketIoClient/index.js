const io = require('socket.io-client');
const events = require('../src/utils/events.sio');
const dotenv = require('dotenv');

dotenv.config();
const config = {
    server: {
        address: process.env.ADDRESS,
        port: process.env.PORT,
    },
    access_token: process.env.ACCESS_TOKEN,
};

//#region Подключение к серверу

const socket = io.connect(
    `http://${config.server.address}:${config.server.port}`,
    {
        query: { token: config.access_token },
    }
);

socket.on('connect', () => {
    console.log('Мы подключились!');
});

socket.on('disconnect', (reason) => {
    console.log(`Мы отключились по причине: ${reason}`);
    // Если это сервер нас отключил, то переподключаемся
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

socket.on('connect_error', (error) => {
    console.info(error);
    setTimeout(() => {
        socket.connect();
    }, 1000);
});

//#endregion

const queueId = 1; // Очередь, которую отслеживаем

// Сначала нужно встать в очередь.
// После этого подписываемся на события очереди:
socket.emit(events.QUEUE_SUBSCRIBE, { queueId });
// Отслеживаем ответ сервера об успехе операции:
socket.on(events.MESSAGE, (msg) => {
    console.log('Сообщение от сервера:', msg);
});
// После этого мы будем получить события перечисленные ниже.
// Кто-то встал в конец очереди:
socket.on(events.QUEUE_MEMBER_ENTRY, (position) => {
    console.log(
        `[${events.QUEUE_MEMBER_ENTRY}] UID: ${position.userId} в очереди с QID: ${position.queueId} на последней позиции: ${position.place}.`
    );
});
// Владелец очереди кого-то передвинул в очереди
socket.on(events.QUEUE_MEMBER_MOVE, (data) => {
    console.log(
        `[${events.QUEUE_MEMBER_MOVE}] UID: ${data.position.userId} в очереди с QID: ${data.position.queueId} теперь на позиции: ${data.position.place}. Новый список:`,
        data.members
    );
});
// Кто-то покинул очередь:
socket.on(events.QUEUE_MEMBER_LEAVE, (position) => {
    console.log(
        `[${events.QUEUE_MEMBER_LEAVE}] UID: ${position.userId} покинул очередь с QID: ${position.queueId}, он был на позиции: ${position.place}.`
    );
});
// Информация об очереди обновлена:
socket.on(events.QUEUE_UPDATE, (queue) => {
    console.log(
        `[${events.QUEUE_UPDATE}] Информация об очереди с QID: ${queue.id} обновлена.`
    );
});
// Очередь удалена владельцем:
socket.on(events.QUEUE_DELETED, (queue) => {
    console.log(
        `[${events.QUEUE_DELETED}] Очередь с QID: ${queue.id} удалена.`
    );
});
// Очередь закрыта по расписанию:
socket.on(events.QUEUE_CLOSED, (queue) => {
    console.log(
        `[${events.QUEUE_CLOSED}] Очередь с QID: ${queue.id} закрыта по расписанию.`
    );
});
// Участник очереди изменил информацию о себе:
socket.on(events.USER_UPDATE, (user) => {
    console.log(
        `[${events.USER_UPDATE}] UID: ${user.id} обновил информацию о себе.`
    );
});
// У очереди было изменено расписание работы:
socket.on(events.QUEUE_SCHEDULE_CREATE, (schedule) => {
    console.log(
        `[${events.QUEUE_SCHEDULE_CREATE}] Очередь с QID: ${schedule.queueId} создала новое расписание.`
    );
});
socket.on(events.QUEUE_SCHEDULE_UPDATE, (schedule) => {
    console.log(
        `[${events.QUEUE_SCHEDULE_UPDATE}] Очередь с QID: ${schedule.queueId} обновила расписание с SID: ${schedule.id}.`
    );
});
socket.on(events.QUEUE_SCHEDULE_DELETED, (schedule) => {
    console.log(
        `[${events.QUEUE_SCHEDULE_DELETED}] Очередь с QID: ${schedule.queueId} удалила расписание с SID: ${schedule.id}.`
    );
});
// У очереди был изменен особый день:
socket.on(events.QUEUE_HOLIDAY_CREATE, (holiday) => {
    console.log(
        `[${events.QUEUE_HOLIDAY_CREATE}] Очередь с QID: ${holiday.queueId} создала новый особый день.`
    );
});
socket.on(events.QUEUE_HOLIDAY_UPDATE, (holiday) => {
    console.log(
        `[${events.QUEUE_HOLIDAY_UPDATE}] Очередь с QID: ${holiday.queueId} обновила особый день с HID: ${holiday.id}.`
    );
});
socket.on(events.QUEUE_HOLIDAY_DELETED, (holiday) => {
    console.log(
        `[${events.QUEUE_HOLIDAY_DELETED}] Очередь с QID: ${holiday.queueId} удалила особый день с HID: ${holiday.id}.`
    );
});
