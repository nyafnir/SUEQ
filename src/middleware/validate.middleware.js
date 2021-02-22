module.exports = (target, next, schema) => {
    const { error, value } = schema.validate(target, {
        abortEarly: false, // Вернуть только первую найденную ошибку
        allowUnknown: true, // Игнорировать поля не указанные в схеме
        stripUnknown: true, // Удалять поля не указаные в схеме
    });

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
