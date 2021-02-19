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
    generateSalt,
    hash,
};
