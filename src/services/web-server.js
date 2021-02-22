const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const { server } = require('../config.js');
const { homepage } = require('../../package.json');
const { log } = require('../logger');

let httpServer;

const initialize = () => {
    return new Promise((resolve, reject) => {
        const app = express();
        httpServer = http.createServer(app);

        // Обработка content-type: application/json
        app.use(bodyParser.json());
        // Обработка content-type: application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ extended: true }));

        //#region Маршруты

        app.get('/', (request, response) => {
            response.redirect('/api');
        });

        app.get('/api', (request, response) => {
            response.redirect(homepage);
        });

        require('../routes/user.routes')(app);

        //#endregion

        app.get('*', (request, response) => {
            response.status(404).json();
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
