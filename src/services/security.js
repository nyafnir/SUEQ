const jwt = require('jsonwebtoken');

// key: refresh; value: access
const listTokens = {};

function getAccessToken(userId) {
    return jwt.sign(userId, process.env.TOKEN_ACCESS_SECRET, {
        expiresIn: `${process.env.TOKEN_ACCESS_LIFE_SECONDS}s`,
    });
}

function getRefreshToken(userId) {
    return jwt.sign(userId, process.env.TOKEN_REFRESH_SECRET, {
        expiresIn: `${process.env.TOKEN_REFRESH_LIFE_SECONDS}s`,
    });
}

const createTokens = (userId) => {
    const access = getAccessToken(userId);
    const refresh = getRefreshToken(userId);
    listTokens[refresh] = {
        access_token: access,
        access_token_life_seconds: process.env.TOKEN_ACCESS_LIFE_SECONDS,
        refresh_token: refresh,
        refresh_token_life_seconds: process.env.TOKEN_REFRESH_LIFE_SECONDS,
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

const hasher = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        hashedpassword: value,
    };
};

const hash = (password, salt) => {
    if (password == null || salt == null) {
        throw new Error('Не указан пароль или соль');
    }
    if (typeof password !== 'string' || typeof salt !== 'string') {
        throw new Error('Пароль и соль должны иметь тип строки.');
    }
    return hasher(password, salt);
};

module.exports = {
    createTokens,
    updateAccessToken,
    generateSalt,
    hash,
};
