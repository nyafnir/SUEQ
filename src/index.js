const webServer = require('./services/web-server');
const config = require('./config');
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
        process.exit(1);
    }

    log.info('Завершение процесса...');

    process.exit(0);
};

const startup = async () => {
    log.info('Запуск сервера...');

    log.info('Инициализация главного модуля...');
    await webServer.initialize();

    log.info(
        `Соединение с базой данных ${config.database.credentials.database} по адресу: http://${config.database.credentials.host}:${config.database.credentials.port}`
    );
    await db.sequelize.sync(config.database.sequelize);

    log.info('Сервер запущен!');
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

process.on('uncaughtException', (err) => {
    log.fatal(err);

    shutdown();
});

//#endregion
