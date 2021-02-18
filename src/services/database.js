const mysql2 = require('mysql2');
const dbConfig = require('../config/database.js');

let pool;

function initialize() {
    pool = mysql2.createPool(dbConfig.connection);
    // Проверка соединения
    pool.getConnection((err, connection) => {
        if (err) {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Потеряно соединение с базой данных.');
            }
            if (err.code === 'ER_CON_COUNT_ERROR') {
                console.error('Слишком много соединений с базой данных.');
            }
            if (err.code === 'ECONNREFUSED') {
                console.error('Отказано в подключении к базе данных.');
            }
        }
        if (connection) {
            connection.release();
        }
        return;
    });
}

module.exports.initialize = initialize;

function close() {
    pool.end();
}

module.exports.close = close;

const HttpStatusCodes = Object.freeze({
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 422,
    ER_DUP_ENTRY: 409
});

async function execute(sql, values) {
    return new Promise((resolve, reject) => {
        const callback = (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        }

        pool.execute(sql, values, callback);
    }).catch(err => {
        const mysqlErrorList = Object.keys(HttpStatusCodes);
        err.status = mysqlErrorList.includes(err.code) ? HttpStatusCodes[err.code] : err.status;

        throw err;
    });
}

module.exports.execute = execute;