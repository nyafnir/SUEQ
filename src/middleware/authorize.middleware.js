const exjwt = require('express-jwt');
const Response = require('../response');
const { tokens } = require('../config');
const db = require('../models');

// TODO: roles(), permissions()
module.exports = () => {
    return [
        exjwt({ secret: tokens.access.secret, algorithms: ['HS256'] }),
        async (request, response, next) => {
            request.user = await db.User.findByPk(request.user.id);

            if (request.user === null) {
                return response
                    .status(401)
                    .send(new Response('Доступ запрещен.'));
            }

            request.user.refreshTokens = await db.RefreshToken.findAllByUserId(
                request.user.id
            );

            next();
        },
    ];
};
