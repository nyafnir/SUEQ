const Response = require('../response');

const errorHandler = (err, request, response, next) => {
    switch (true) {
        case err.name === 'ValidationError':
            return response
                .status(400)
                .send(
                    new Response(
                        'Ошибка в введенных данных.',
                        'Ошибки перечисленны в data.',
                        err.messages
                    )
                );
        case err.name === 'UnauthorizedError':
            return response
                .status(401)
                .send(
                    new Response(
                        'Вы не авторизованы в системе, сначала нужно войти!',
                        err.name,
                        err
                    )
                );
        case typeof err === 'string':
            if (err.toLowerCase().endsWith('not found')) {
                return response
                    .status(404)
                    .send(
                        new Response(
                            'Такой страницы нет на сервере.',
                            `Имя ошибки: ${err.name}. Содержимое указано в data.`,
                            err
                        )
                    );
            }
            return response
                .status(400)
                .send(
                    new Response(
                        'Ошибка в запросе.',
                        `Имя ошибки: ${err.name}. Содержимое указано в data.`,
                        err
                    )
                );
        default:
            return response
                .status(500)
                .send(
                    new Response(
                        'Неизвестная ошибка сервера, сообщите об этом в службу поддержки.',
                        `Имя ошибки: ${err.name}. Содержимое указано в data.`,
                        err
                    )
                );
    }
};

module.exports = errorHandler;
