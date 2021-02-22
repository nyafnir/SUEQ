const jwt = require('jsonwebtoken');
const Response = require('../response');
const { tokens } = require('../config');

module.exports = (request, response, next) => {
    const token =
        request.body.token ||
        request.query.token ||
        request.headers['x-access-token'];

    if (token) {
        jwt.verify(token, tokens.access.secret, (error, decoded) => {
            if (error) {
                return response.status(401).send(new Response('Нет доступа.'));
            }
            request.decoded = decoded;
            next();
        });
    } else {
        return response
            .status(403)
            .send(new Response('Токен доступа не указан в запросе.'));
    }
};
