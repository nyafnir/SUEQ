const Joi = require('joi');
const validate = require('../middleware/validate.middleware');

const queue = {
    id: Joi.number().integer(),
    name: Joi.string().min(3).max(100),
    description: Joi.string().min(3).max(2000),
};

const queueIdSchema = (target, response, next) => {
    const schema = Joi.object({
        queueId: queue.id.required(),
    });
    validate(target, next, schema);
};

const createQueueSchema = (target, response, next) => {
    const schema = Joi.object({
        name: queue.name.required(),
        description: queue.description.required(),
    });
    validate(target, next, schema);
};

const updateQueueSchema = (target, response, next) => {
    const schema = Joi.object({
        name: queue.name,
        description: queue.description,
    })
        .min(1) // Не даёт отправить {}
        .required(); // Не даёт отправить undefined
    validate(target, next, schema);
};

module.exports = {
    queueIdSchema,
    createQueueSchema,
    updateQueueSchema,
};
