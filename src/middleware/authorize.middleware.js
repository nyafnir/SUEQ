const exjwt = require('express-jwt');
const Response = require('../response');
const { tokens } = require('../config');
const db = require('../models');

module.exports = (roles = [] /* string || string[] */) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        exjwt({ secret: tokens.access.secret, algorithms: ['HS256'] }),
        async (request, response, next) => {
            const user = await db.User.findByPk(request.user.id);

            if (
                user == null ||
                (roles.length && roles.includes(user.role) === false)
            ) {
                return response
                    .status(401)
                    .send(new Response('Доступ запрещен.'));
            }

            // TODO: roles(), permissions()
            /*
            request.user.role = user.role;
            const refreshTokens = await db.RefreshToken.find({ user: user.id });
            request.user.ownsToken = (token) =>
                !!refreshTokens.find((x) => x.token === token);
            */
            next();
        },
    ];
};
