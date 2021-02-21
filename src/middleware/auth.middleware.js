const jwt = require('jsonwebtoken');
const Response = require('../response');

module.exports = (request, response, next) => {
    const token =
        request.body.token ||
        request.query.token ||
        request.headers['x-access-token'];

    if (token) {
        jwt.verify(
            token,
            process.env.TOKEN_ACCESS_SECRET,
            function (err, decoded) {
                if (err) {
                    return response
                        .status(401)
                        .send(new Response('Нет доступа.'));
                }
                request.decoded = decoded;
                next();
            }
        );
    } else {
        return response
            .status(403)
            .send(new Response('Токен доступа не указан в запросе.'));
    }
};
