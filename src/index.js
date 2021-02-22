const webServer = require('./services/web-server.js');
const { database } = require('./config');
const db = require('./models');
const { log } = require('./logger');

const startup = async () => {
    log.info('Запуск сервера...');

    try {
        log.info('Инициализация главного модуля...');

        await webServer.initialize();
    } catch (err) {
        log.error(err);

        process.exit(1);
    }

    try {
        log.info(
            `Соединение с базой данных ${database.credentials.database} по адресу: http://${database.credentials.host}:${database.credentials.port}`
        );

        await db.sequelize.sync({ force: false });
    } catch (err) {
        log.error(err);

        process.exit(1);
    }
};

startup();

const shutdown = async (error = null) => {
    let err = error;

    log.warn('Выключение сервера...');

    try {
        log.warn('Завершение главного модуля...');

        await webServer.close();
    } catch (error) {
        log.error('Обнаружена ошибка главного модуля', error);

        err = err || error;
    }

    try {
        log.warn('Отключение от базы данных...');

        await db.sequelize.close();
    } catch (error) {
        log.error('Обнаружена ошибка при отключении от базы данных', error);

        err = err || error;
    }

    log.warn('Завершение приложения...');

    if (err) {
        process.exit(1);
    } else {
        process.exit(0);
    }
};

//#region Отслеживаем событие закрытия сервера

process.on('SIGTERM', () => {
    log.warn('Отправлен SIGTERM от какого-то процесса извне!');

    shutdown();
});

process.on('SIGINT', () => {
    log.warn('Отправлен SIGINT (Ctrl + C)!');

    shutdown();
});

process.on('uncaughtException', (err) => {
    log.error('Непредвиденная ошибка!', err);

    shutdown(err);
});

//#endregion
