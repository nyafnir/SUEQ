var Service = require('node-windows').Service;
var config = require('./package');

var svc = new Service({
    name: config.name,
    description: config.description,
    script: require('path').join(__dirname, config.main),
    wait: 10, // Если процесс закрылся, то перезапуск через wait секунд
    grow: 0.5, // Новая попытка перезапуска через = wait / grow секунд
    maxRetries: 2, // Максимум попыток перезапуска
    abortOnError: true, // Если к закрытию привела ошибка, то не перезапускать
});

svc.on('install', function () {
    svc.start();
});

svc.install();
