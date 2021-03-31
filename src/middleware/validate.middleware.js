const { middleware } = require('../config');

module.exports = (target, next, schema) => {
    const { error, value } = schema.validate(target, middleware.validate);

    if (error) {
        next({
            name: 'ValidationError',
            messages: error.details.map((x) => x.message),
        });
    } else {
        target = value;
        next();
    }
};
