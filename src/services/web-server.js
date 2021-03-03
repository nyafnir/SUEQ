const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { server } = require('../config.js');
const { homepage } = require('../../package.json');
const log = require('../logger');
const errorHandler = require('../handlers/error.handler');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

let httpServer;

const initialize = () => {
    return new Promise((resolve, reject) => {
        const app = express();
        httpServer = http.createServer(app);

        // Обработка content-type: application/json
        app.use(bodyParser.json());
        // Обработка куков
        app.use(cookieParser());

        // Ограничение скорости за лёгкий спам запросами
        const speedLimiter = slowDown(server.limit.speed);
        app.use(speedLimiter);

        // Блокировка за серьёзный спам запросами
        const rateLimiter = rateLimit(server.limit.rate);
        app.use(rateLimiter);

        // Защита HTTP-заголовков (содержит в себе 11 проверок)
        app.use(helmet());

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
        app.use(
            '/api/v2/holidays',
            require('../controllers/holidays.controller')
        );

        //#endregion

        app.use(errorHandler);

        // Если искомого адреса не существует, то выдать ошибку с кодом 404
        app.get('*', function (request, response) {
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
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
};

// Функция close возвращает promise, который разрешается при успешном
// закрытии веб-сервера. Метод httpServer.close останавливает установление
// новых соединений, но не заставляет закрывать уже открытые соединения
const close = () => {
    return new Promise((resolve, reject) => {
        httpServer.close((err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
};

module.exports = {
    initialize,
    close,
};
