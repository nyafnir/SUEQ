const jwt = require('jsonwebtoken');
const config = require('../config');

let io;
const clients = [];

const initialize = async (httpServer) => {
    io = require('socket.io')(httpServer);

    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(
                socket.handshake.query.token,
                config.tokens.access.secret,
                (err, decoded) => {
                    if (err) {
                        return next(new Error('Неправильный токен.'));
                    }
                    socket.payload = decoded;
                    next();
                }
            );
        } else {
            next(new Error('Не указан токен доступа.'));
        }
    }).on('connection', function (client) {
        clients.push(client.id);
        // console.log(client.payload.id);
        client.on('disconnect', (client) => {
            clients.splice(clients.indexOf(client.id), 1);
        });
    });
};

module.exports = {
    io,
    initialize,
};
