const exjwt = require('express-jwt');
const Response = require('../response');
const { tokens } = require('../config');
const db = require('../models');

module.exports = () => {
    return [
        exjwt({ secret: tokens.access.secret, algorithms: ['HS256'] }),
        async (request, response, next) => {
            try {
                request.user = await db.User.findByUserId(request.user.id);
            } catch {
                return response
                    .status(401)
                    .send(new Response('Доступ запрещен.'));
            }

            next();
        },
    ];
};
