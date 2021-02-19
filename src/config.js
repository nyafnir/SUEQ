const dotenv = require('dotenv');
// Загружаем файл .env в process.env
dotenv.config();

module.exports = {
    server: {
        address: process.env.ADDRESS || 'localhost',
        port: process.env.PORT || 3000,
    },
    database: {
        dialect: 'mysql',
        credentials: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '3306',
            database: process.env.DB_DATABASE || 'ueq',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },
};
