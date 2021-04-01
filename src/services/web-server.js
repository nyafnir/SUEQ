const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

const webSocket = require('./web-socket');
const log = require('../logger');
const errorHandler = require('../handlers/error.handler');

const { homepage } = require('../../package.json');
const { server } = require('../config.js');

let httpServer;

const initialize = async () => {
    const app = express();

    httpServer = http.createServer(app);

    // Обработка content-type: application/json
    app.use(express.json());

    // Обработка куков
    app.use(cookieParser());

    // Ограничение скорости за спам запросами
    const speedLimiter = slowDown(server.limit.speed);
    app.use(speedLimiter);

    // Блокировка за спам запросами
    const rateLimiter = rateLimit(server.limit.rate);
    app.use(rateLimiter);

    // Защита HTTP-заголовков (содержит в себе 11 проверок)
    app.use(helmet());

    await webSocket.initialize(httpServer);

    //#region Маршруты

    app.get('/', (request, response) => {
        response.redirect('/api');
    });

    app.get('/api', (request, response) => {
        response.redirect(homepage);
    });

    app.use('/api/v2/users', require('../controllers/users.controller'));

    app.use('/api/v2/queues', require('../controllers/queues.controller'));

    app.use(
        '/api/v2/positions',
        require('../controllers/positions.controller')
    );

    app.use(
        '/api/v2/schedules',
        require('../controllers/schedules.controller')
    );

    app.use('/api/v2/holidays', require('../controllers/holidays.controller'));

    //#endregion

    app.use(errorHandler);

    // Если искомого адреса не существует, то выдать ошибку с кодом 404
    app.use('*', (request, response) => {
        response.status(404).send();
    });

    const webServer = httpServer
        .listen(server.port, server.address)
        .on('listening', () => {
            log.info(
                `Веб-сервер доступен по адресу: http://${
                    webServer.address().address
                }:${webServer.address().port}`
            );
        });
};

const close = async () => {
    httpServer.close();
};

module.exports = {
    initialize,
    close,
};
