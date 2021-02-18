const http = require('http');
const express = require('express');
const morgan = require('morgan');
const webServerConfig = require('../config/web-server.js');
const { homepage } = require('../../package.json');
const database = require('./database.js');

let httpServer;

// Функция немедленно возвращает promise, которое разрешается или 
// отклоняется в зависимости от того, успешно ли запущен веб-сервер
function initialize() {
    return new Promise((resolve, reject) => {
        // Создается новое экспресс-приложение (которое на самом деле является просто функцией), 
        // а затем используется для создания http-сервера через модуль http.
        const app = express();
        httpServer = http.createServer(app);

        // Промежуточное программное обеспечение, через которое
        // все запросы будут обрабатываться с помощью app.use
        app.use(morgan('combined'));

        // Метод get приложения используется для добавления обработчика для запросов GET, 
        // которые приходят по корневому пути (/). Функция обратного будет вызываться при 
        // получении такого запроса, и она будет использовать параметр «res» (res) для 
        // отправки ответа клиенту.
        app.get('/', (_, response) => {
            response.redirect("/api/v2");
        });

        app.get('/api/v2', (_, response) => {
            response.redirect(homepage);
        });

        app.get('/api/v2/test/db', async (_, response) => {
            const result = await database.execute('select firstname, surname from users');
            const user = result.shift();
            response.end(`DB user: ${user.firstname} ${user.surname}`);
        });

        // Метод прослушивания сервера используется для привязки к указанному порту и запуска прослушивания входящих запросов.
        const server = httpServer.listen(webServerConfig.port, webServerConfig.address)
            .on('listening', () => {
                console.log(`Веб-сервер доступен по адресу: http://${server.address().address}:${server.address().port}`);
                resolve();
            })
            .on('error', err => {
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
