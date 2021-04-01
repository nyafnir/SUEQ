const webServer = require('./services/web-server.js');
const { database } = require('./config');
const db = require('./models');
const log = require('./logger');

const shutdown = async () => {
    log.info('Выключение сервера...');

    try {
        log.info('Завершение главного модуля...');
        await webServer.close();

        log.info('Отключение от базы данных...');
        await db.sequelize.close();
    } catch (error) {
        log.error(error);
        process.exit(1);
    }

    log.info('Завершение процесса...');

    process.exit(0);
};

const startup = async () => {
    log.info('Запуск сервера...');

    try {
        log.info('Инициализация главного модуля...');
        await webServer.initialize();

        log.info(
            `Соединение с базой данных ${database.credentials.database} по адресу: http://${database.credentials.host}:${database.credentials.port}`
        );
        await db.sequelize.sync(database.sequelize);
    } catch (error) {
        log.error(error);

        shutdown();
    }
};

startup();

//#region Ловим события завершения программы

process.on('SIGTERM', () => {
    log.warn('Отправлен SIGTERM от какого-то процесса извне!');

    shutdown();
});

process.on('SIGINT', () => {
    log.warn('Отправлен SIGINT (Ctrl + C)!');

    shutdown();
});

process.on('uncaughtException', (error) => {
    log.error('Непредвиденная ошибка!\n' + error);

    shutdown();
});

//#endregion
