var Service = require('node-windows').Service;
var config = require('./package');

var svc = new Service({
    name: config.name,
    description: config.description,
    script: require('path').join(__dirname, config.main),
});

svc.on('uninstall', function () {
    console.log(
        `Удаление службы "${config.name}" ${
            svc.exists ? 'не удалось' : 'завершено'
        }.`
    );
});

svc.uninstall();
