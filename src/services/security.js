const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { tokens } = require('../config');

// key: refresh; value: access
const listTokens = {};

const getAccessToken = (userId) => {
    return jwt.sign({ uid: userId }, tokens.access.secret, {
        expiresIn: `${tokens.access.life}s`,
        algorithm: 'HS256',
    });
};

const getRefreshToken = (userId) => {
    return jwt.sign({ uid: userId }, tokens.refresh.secret, {
        expiresIn: `${tokens.refresh.life}s`,
        algorithm: 'HS256',
    });
};

const createTokens = (userId) => {
    const access = getAccessToken(userId);
    const refresh = getRefreshToken(userId);
    listTokens[refresh] = {
        access_token: access,
        access_token_life: tokens.access.life,
        refresh_token: refresh,
        refresh_token_life: tokens.refresh.life,
    };
    return listTokens[refresh];
};

const updateAccessToken = (userId, refreshToken) => {
    if (refreshToken in listTokens) {
        listTokens[refreshToken].access_token = getAccessToken(userId);
        return listTokens[refreshToken];
    } else {
        throw new Error('Токен обновления не действителен.');
    }
};

const generateSalt = (rounds) => {
    if (rounds >= 15) {
        throw new Error(`${rounds} больше 15, а должно быть меньше.`);
    }
    if (typeof rounds !== 'number') {
        throw new Error('Параметр округления должен быть целочисленным');
    }
    if (rounds == null) {
        rounds = 12;
    }
    return crypto
        .randomBytes(Math.ceil(rounds / 2))
        .toString('hex')
        .slice(0, rounds);
};

const hash = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('hex');
};

module.exports = {
    createTokens,
    updateAccessToken,
    generateSalt,
    hash,
};
