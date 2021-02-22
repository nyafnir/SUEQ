const pino = require('pino');

const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'hostname,pid',
    },
});

module.exports = {
    info: (message, details) => logger['info'](message, details),
    warn: (message, details) => logger['warn'](message, details),
    error: (message, details) => logger['error'](message, details),
    fatal: (message, details) => logger['fatal'](message, details),
    trace: (message, details) => logger['trace'](message, details),
};
