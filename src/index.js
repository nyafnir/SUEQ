const webServer = require('./services/web-server.js');
const connection = require('./services/database.js');

async function startup() {
    console.info('Запуск сервера...');

    try {
        console.info('Инициализация главного модуля...');

        await webServer.initialize();
    } catch (err) {
        console.error(err);

        process.exit(1);
    }
}

startup();

async function shutdown(e) {
    let err = e;

    console.warn('Выключение сервера...');

    try {
        console.warn('Завершение главного модуля...');

        await webServer.close();
    } catch (e) {
        console.error('Обнаружена ошибка главного модуля', e);

        err = err || e;
    }

    try {
        console.warn('Отключение от базы данных...');

        await connection.end();
    } catch (err) {
        console.error('Обнаружена ошибка при отключении от базы данных', e);

        err = err || e;
    }

    console.warn('Завершение приложения...');

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

process.on('uncaughtException', (err) => {
    console.log('Непредвиденная ошибка');
    console.error(err);

    shutdown(err);
});

//#endregion
