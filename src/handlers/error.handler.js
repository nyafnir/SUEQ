const Response = require('../response');

const errorHandler = (error, request, response, next) => {
    switch (true) {
        case error instanceof Response:
            return response.status(400).send(error);
        case error.name === 'ValidationError':
            return response
                .status(400)
                .send(
                    new Response(
                        'Ошибка в введенных данных.',
                        'Ошибки перечислены в data.',
                        error.messages
                    )
                );
        case error.name === 'UnauthorizedError':
            return response
                .status(401)
                .send(
                    new Response(
                        'Вы не авторизованы в системе, сначала нужно войти!',
                        `${error.name}: ${error.message} ${error.inner.expiredAt}`
                    )
                );
        default:
            return response
                .status(500)
                .send(
                    new Response(
                        'Неизвестная ошибка сервера, сообщите об этом в службу поддержки.',
                        `Имя ошибки: ${
                            error.name
                        }. Время: ${Date.now().toString()}. Содержимое указано в data.`,
                        error
                    )
                );
    }
};

module.exports = errorHandler;
