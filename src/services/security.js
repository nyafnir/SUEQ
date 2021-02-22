const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { tokens, hash } = require('../config');

// key: refresh; value: access
const refreshSessions = {};

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, tokens.access.secret, {
        expiresIn: `${tokens.access.life}ms`,
        algorithm: 'HS256',
    });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, tokens.refresh.secret, {
        expiresIn: `${tokens.refresh.life}ms`,
        algorithm: 'HS256',
    });
};

const generateCustomToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, {
        expiresIn,
        algorithm: 'HS256',
    });
};

// Если токен актуален, то вернёт payload, иначе null
const decodeToken = async (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch {
        return null;
    }
};

const createTokens = (userId) => {
    const access = generateAccessToken(userId);
    const refresh = generateRefreshToken(userId);
    refreshSessions[refresh] = {
        access: {
            token: access,
            life: tokens.access.life,
        },
        refresh: {
            token: refresh,
            life: tokens.refresh.life,
        },
    };
    return refreshSessions[refresh];
};

const updateAccessToken = (userId, refreshToken) => {
    if (refreshToken in refreshSessions) {
        refreshSessions[refreshToken].access.token = generateAccessToken(
            userId
        );
        return refreshSessions[refreshToken];
    } else {
        throw new Error('Токен обновления не действителен.');
    }
};

const generateSalt = async () => {
    return await bcrypt.genSalt(hash.saltRounds);
};

const hashPassword = async (password, saltOrRounds) => {
    return await bcrypt.hash(password, saltOrRounds);
};

const setTokenCookie = (response, token) => {
    response.cookie('refreshToken', token, {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() + tokens.cookieOptions.expires),
    });
};

module.exports = {
    createTokens,
    updateAccessToken,
    generateSalt,
    hashPassword,
    generateCustomToken,
    decodeToken,
};
