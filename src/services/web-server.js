const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const config = require('../config.js');
const { homepage } = require('../../package.json');

let httpServer;

// Функция немедленно возвращает promise, которое разрешается или
// отклоняется в зависимости от того, успешно ли запущен веб-сервер
function initialize() {
    return new Promise((resolve, reject) => {
        // Создается новое экспресс-приложение (которое на самом деле является просто функцией),
        // а затем используется для создания http-сервера через модуль http.
        const app = express();
        httpServer = http.createServer(app);

        // Обработка content-type: application/json
        app.use(bodyParser.json());
        // Обработка content-type: application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ extended: true }));

        //#region Маршруты

        app.get('*', function (req, res) {
            res.status(404).json();
        });

        app.get('/', (request, response) => {
            response.redirect('/api');
        });

        app.get('/api', (request, response) => {
            response.redirect(homepage);
        });

        require('../routes/user.routes')(app);

        //#endregion

        const db = require('../models');
        db.sequelize.sync({ force: false });

        // Метод прослушивания сервера используется для привязки к указанному порту и запуска прослушивания входящих запросов.
        const server = httpServer
            .listen(config.server.port, config.server.address)
            .on('listening', () => {
                console.log(
                    `Веб-сервер доступен по адресу: http://${
                        server.address().address
                    }:${server.address().port}`
                );
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

module.exports.initialize = initialize;

// Функция close возвращает promise, который разрешается при успешном
// закрытии веб-сервера. Метод httpServer.close останавливает установление
// новых соединений, но не заставляет закрывать уже открытые соединения
function close() {
    return new Promise((resolve, reject) => {
        httpServer.close((err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

module.exports.close = close;
