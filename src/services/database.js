const mysql2 = require('mysql2');
const { database } = require('../config.js');

const connection = mysql2.createConnection(database.credentials);

connection.connect((error) => {
    if (error) {
        throw error;
    }
    console.info(
        `Установлено соединение с базой данных (${database.credentials.host}:${database.credentials.port})`
    );
});

module.exports = connection;
