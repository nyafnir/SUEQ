const jwt = require('jsonwebtoken');

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
                        .json({ error: true, message: 'Доступ запрещен.' });
                }
                request.decoded = decoded;
                next();
            }
        );
    } else {
        return response.status(403).send({
            error: true,
            message: 'Токен доступа не найден в запросе.',
        });
    }
};
