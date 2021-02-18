const dotenv = require('dotenv');
// Загружаем файл .env в process.env
dotenv.config();

const webServer = require('./services/web-server.js');
const database = require('./services/database.js');
const dbConfig = require('./config/database.js');

// Количество открытых соединений с базой данных
const defaultThreadPoolSize = 4; // По умолчанию - 4, этого достаточно для наших задач
process.env.UV_THREADPOOL_SIZE = dbConfig.pool.poolMax + defaultThreadPoolSize;

async function startup() {
    console.log('Запуск сервера универсальной электронной очереди...');

    try {
        console.log('Инициализация модуля базы данных...');

        database.initialize();
    } catch (err) {
        console.error(err);

        process.exit(1);
    }

    try {
        console.log('Инициализация главного модуля веб-сервера...');

        await webServer.initialize();
    } catch (err) {
        console.error(err);

        process.exit(1);
    }
}

startup();

async function shutdown(e) {
    let err = e;

    console.log('Выключение сервера...');

    try {
        console.log('Завершение модуля веб-сервера...');

        await webServer.close();
    } catch (e) {
        console.log('Обнаружена ошибка веб-сервера', e);

        err = err || e;
    }

    try {
        console.log('Завершение модуля базы данных...');

        database.close();
    } catch (err) {
        console.log('Обнаружена ошибка базы данных', e);

        err = err || e;
    }

    console.log('Завершение приложения...');

    if (err) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

//#region Отслеживаем событие закрытия сервера

process.on('SIGTERM', () => {
    console.log('Отправлен SIGTERM от какого-то процесса извне');

    shutdown();
});

process.on('SIGINT', () => {
    console.log('Отправлен SIGINT (Ctrl + C)');

    shutdown();
});

process.on('uncaughtException', err => {
    console.log('Непредвиденная ошибка');
    console.error(err);

    shutdown(err);
});

//#endregion
