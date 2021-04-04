const Joi = require('joi');
const config = require('../config');
const validate = require('../middleware/validate.middleware');

//#region Queues

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

//#endregion

//#region Users

const user = {
    id: Joi.number().integer(),
    token: Joi.string().pattern(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/
    ),
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
    }),
    password: Joi.string().pattern(new RegExp('^[a-zA-ZА-Яа-яё0-9]{6,256}$')),
    surname: Joi.string().min(2).max(100),
    firstname: Joi.string().min(2).max(100),
    lastname: Joi.string().min(2).max(100),
};

const forgotPasswordUserSchema = (target, response, next) => {
    const schema = Joi.object({
        email: user.email.required(),
    });
    validate(target, next, schema);
};

const tokenSchema = (target, response, next) => {
    const schema = Joi.object({
        token: user.token.required(),
    });
    validate(target, next, schema);
};

const userIdAndTokenSchema = (target, response, next) => {
    const schema = Joi.object({
        userid: user.id.required(),
        token: user.token.required(),
    });
    validate(target, next, schema);
};

const registrationUserSchema = (target, response, next) => {
    const schema = Joi.object({
        email: user.email.required(),
        password: user.password.required(),
        surname: user.surname.required(),
        firstname: user.firstname.required(),
        lastname: user.lastname.required(),
    });
    validate(target, next, schema);
};

const authenticateUserSchema = (target, response, next) => {
    const schema = Joi.object({
        email: user.email.required(),
        password: user.password.required(),
    });
    validate(target, next, schema);
};

const updateUserSchema = (target, response, next) => {
    const schema = Joi.object({
        email: user.email,
        password: user.password,
        surname: user.surname,
        firstname: user.firstname,
        lastname: user.lastname,
    })
        .min(1) // Не даёт отправить {}
        .required(); // Не даёт отправить undefined
    validate(target, next, schema);
};

//#endregion

//#region Schedules

const schedule = {
    id: Joi.number().integer(),
    startTime: Joi.string().regex(config.regexs.timeonly),
    endTime: Joi.string().regex(config.regexs.timeonly),
    weekday: Joi.number().integer(),
    workFrom: Joi.string().regex(config.regexs.dateonly),
    workTo: Joi.string().regex(config.regexs.dateonly),
};

const scheduleIdSchema = (target, response, next) => {
    const schema = Joi.object({
        scheduleId: schedule.id.required(),
    });
    validate(target, next, schema);
};

const createScheduleSchema = (target, response, next) => {
    const schema = Joi.object({
        queueId: queue.id.required(),
        startTime: schedule.startTime.required(),
        endTime: schedule.endTime.required(),
        weekday: schedule.weekday.required(),
        workFrom: schedule.workFrom.required(),
        workTo: schedule.workTo.required(),
    });
    validate(target, next, schema);
};

const updateScheduleSchema = (target, response, next) => {
    const schema = Joi.object({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        weekday: schedule.weekday,
        workFrom: schedule.workFrom,
        workTo: schedule.workTo,
    })
        .min(1) // Не даёт отправить {}
        .required(); // Не даёт отправить undefined;
    validate(target, next, schema);
};

//#endregion

//#region Holidays

const holiday = {
    id: Joi.number().integer(),
    date: Joi.string().regex(config.regexs.dateonly),
    isHoliday: Joi.boolean(),
};

const holidayIdSchema = (target, response, next) => {
    const schema = Joi.object({
        holidayId: holiday.id.required(),
    });
    validate(target, next, schema);
};

const createHolidaySchema = (target, response, next) => {
    const schema = Joi.object({
        queueId: queue.id.required(),
        date: holiday.date.required(),
        isHoliday: holiday.isHoliday.required(),
    });
    validate(target, next, schema);
};

const updateHolidaySchema = (target, response, next) => {
    const schema = Joi.object({
        date: holiday.date,
        isHoliday: holiday.isHoliday,
    })
        .min(1) // Не даёт отправить {}
        .required(); // Не даёт отправить undefined
    validate(target, next, schema);
};

//#endregion

//#region Positions

const position = {
    userId: Joi.number().integer(),
    place: Joi.number().integer(),
};

const movePositionSchema = (target, response, next) => {
    const schema = Joi.object({
        place: position.place.required(),
        userId: position.userId.required(),
    });
    validate(target, next, schema);
};

//#endregion

module.exports = {
    // Queues
    queueIdSchema,
    createQueueSchema,
    updateQueueSchema,
    // Users
    registrationUserSchema,
    authenticateUserSchema,
    updateUserSchema,
    tokenSchema,
    userIdAndTokenSchema,
    forgotPasswordUserSchema,
    // Schedules
    scheduleIdSchema,
    createScheduleSchema,
    updateScheduleSchema,
    // Holidays
    holidayIdSchema,
    createHolidaySchema,
    updateHolidaySchema,
    // Positions
    movePositionSchema,
};
